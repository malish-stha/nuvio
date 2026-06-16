import React from 'react'
import { useAuth } from '@clerk/clerk-react'
import { isClerkConfigured } from '../lib/clerk-fallback'
import { pusherClient } from '../lib/pusher-client'
import { RTC_ICE_SERVERS, AUDIO_VAD_THRESHOLD, AUDIO_VAD_HANGOVER_MS, AUDIO_FFT_SIZE } from '../lib/constants'
import { playJoinSound, playLeaveSound } from '../lib/sounds'

interface UseVoiceCallProps {
  activeUserId: string | null | undefined
  activeUserFullName: string | null | undefined
  activeUserImage: string | null | undefined
  dbUser: any
  activeChannelId: string
  activeChannelName: string
  activeChannelType: string
  activeServerId: string
}

export const useVoiceCall = ({
  activeUserId,
  activeUserFullName,
  activeUserImage,
  dbUser,
  activeChannelId,
  activeChannelName,
  activeChannelType,
  activeServerId
}: UseVoiceCallProps) => {
  const { getToken } = isClerkConfigured ? useAuth() : { getToken: async () => 'mock-token' }

  // Voice Call States
  const [isMuted, setIsMuted] = React.useState(false)
  const [isDeafened, setIsDeafened] = React.useState(false)
  const [connectedVoiceChannel, setConnectedVoiceChannel] = React.useState<any>(null)
  const [voiceParticipants, setVoiceParticipants] = React.useState<any[]>([])

  // WebRTC & Audio Analyser Refs
  const peerConnectionsRef = React.useRef<Record<string, RTCPeerConnection>>({})
  const localStreamRef = React.useRef<MediaStream | null>(null)
  const remoteAudioElementsRef = React.useRef<Record<string, HTMLAudioElement>>({})
  const audioAnalysersRef = React.useRef<Record<string, { audioContext: AudioContext; analyser: AnalyserNode; animationFrameId: number }>>({})
  const speakingStatesRef = React.useRef<Record<string, boolean>>({})
  const lastSpokeTimesRef = React.useRef<Record<string, number>>({})

  // Screen Sharing States & Refs
  const [isScreenSharing, setIsScreenSharing] = React.useState(false)
  const screenStreamRef = React.useRef<MediaStream | null>(null)
  const [screenSources, setScreenSources] = React.useState<any[]>([])
  const [isScreenPickerOpen, setIsScreenPickerOpen] = React.useState(false)

  // Track voice connection state from active channel updates
  React.useEffect(() => {
    if (activeChannelType === 'VOICE' && activeChannelId) {
      setConnectedVoiceChannel({ id: activeChannelId, name: activeChannelName, serverId: activeServerId })
    }
  }, [activeChannelId, activeChannelType, activeChannelName, activeServerId])

  const sendSignal = async (channelId: string, type: string, payload: any = {}, targetUserId: string | null = null) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      await fetch('/api/voice/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channelId,
          type,
          payload,
          targetUserId
        })
      })
    } catch (err) {
      console.error('Failed to send voice signal:', err)
    }
  }

  const stopAudioAnalysis = (userId: string) => {
    const analysis = audioAnalysersRef.current[userId]
    if (analysis) {
      cancelAnimationFrame(analysis.animationFrameId)
      try {
        analysis.audioContext.close()
      } catch (e) { }
      delete audioAnalysersRef.current[userId]
    }
  }

  const startAudioAnalysis = (userId: string, stream: MediaStream) => {
    try {
      stopAudioAnalysis(userId)

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = AUDIO_FFT_SIZE
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let animationFrameId = 0

      speakingStatesRef.current[userId] = false
      lastSpokeTimesRef.current[userId] = 0

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length

        // Threshold of AUDIO_VAD_THRESHOLD to reduce sensitivity to ambient noise
        const soundDetected = average > AUDIO_VAD_THRESHOLD
        const now = Date.now()

        if (soundDetected) {
          lastSpokeTimesRef.current[userId] = now
        }

        // Hangover period of silence to avoid rapid avatar flickering
        const lastSpoke = lastSpokeTimesRef.current[userId] || 0
        const isSpeaking = soundDetected || (now - lastSpoke < AUDIO_VAD_HANGOVER_MS)

        const wasSpeaking = speakingStatesRef.current[userId] || false
        if (isSpeaking !== wasSpeaking) {
          speakingStatesRef.current[userId] = isSpeaking
          setVoiceParticipants(prev => {
            const p = prev.find(item => item.id === userId)
            if (p && p.isTalking === isSpeaking) {
              return prev
            }
            return prev.map(item => {
              if (item.id === userId) {
                return { ...item, isTalking: isSpeaking }
              }
              return item
            })
          })
        }

        animationFrameId = requestAnimationFrame(checkVolume)
      }

      checkVolume()

      audioAnalysersRef.current[userId] = {
        audioContext,
        analyser,
        animationFrameId
      }
    } catch (err) {
      console.error('Failed to start audio analysis for', userId, err)
    }
  }

  const createPeerConnection = (peerId: string, channelId: string) => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId]
    }

    const pc = new RTCPeerConnection({
      iceServers: RTC_ICE_SERVERS
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(channelId, 'ice-candidate', { candidate: event.candidate }, peerId)
      }
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (remoteStream) {
        if (event.track.kind === 'video') {
          setVoiceParticipants(prev => prev.map(p => {
            if (p.id === peerId) {
              return { ...p, screenStream: remoteStream, isScreenSharing: true }
            }
            return p
          }))
          event.track.onended = () => {
            setVoiceParticipants(prev => prev.map(p => {
              if (p.id === peerId) {
                return { ...p, screenStream: null, isScreenSharing: false }
              }
              return p
            }))
          }
        } else {
          const audio = new Audio()
          audio.srcObject = remoteStream
          audio.autoplay = true
          audio.muted = isDeafened
          audio.play().catch(err => console.error('Audio play failed:', err))
          remoteAudioElementsRef.current[peerId] = audio

          startAudioAnalysis(peerId, remoteStream)
        }
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    peerConnectionsRef.current[peerId] = pc
    return pc
  }

  const joinVoiceChannel = (channelId: string) => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return

    const currentUid = activeUserId || 'local-user'

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current = stream
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted
        })

        const selfParticipant = {
          id: currentUid,
          name: dbUser?.fullName || activeUserFullName || 'You',
          avatar: dbUser?.imageUrl || activeUserImage || null,
          isTalking: false,
          isLocal: true,
          isMuted,
          isDeafened
        }
        setVoiceParticipants([selfParticipant])

        startAudioAnalysis(currentUid, stream)
        playJoinSound()

        if (pusherClient) {
          const voiceChannel = pusherClient.subscribe(`voice-${channelId}`)

          voiceChannel.bind('user-joined', (data: any) => {
            if (data.fromUserId === currentUid) return
            playJoinSound()

            setVoiceParticipants(prev => {
              if (prev.some(p => p.id === data.fromUserId)) return prev
              return [...prev, {
                id: data.fromUserId,
                name: data.user?.fullName || 'User',
                avatar: data.user?.imageUrl || null,
                isTalking: false,
                isLocal: false,
                isMuted: data.payload?.isMuted,
                isDeafened: data.payload?.isDeafened,
                isScreenSharing: data.payload?.isScreenSharing
              }]
            })

            const pc = createPeerConnection(data.fromUserId, channelId)
            pc.createOffer()
              .then(async (offer) => {
                await pc.setLocalDescription(offer)
                sendSignal(channelId, 'offer', { sdp: offer }, data.fromUserId)
              })
              .catch(err => console.error('Error creating offer:', err))
          })

          voiceChannel.bind('offer', (data: any) => {
            if (data.targetUserId !== currentUid) return

            setVoiceParticipants(prev => {
              if (prev.some(p => p.id === data.fromUserId)) return prev
              return [...prev, {
                id: data.fromUserId,
                name: data.user?.fullName || 'User',
                avatar: data.user?.imageUrl || null,
                isTalking: false,
                isLocal: false,
                isMuted: data.payload?.isMuted,
                isDeafened: data.payload?.isDeafened,
                isScreenSharing: data.payload?.isScreenSharing
              }]
            })

            const pc = createPeerConnection(data.fromUserId, channelId)
            pc.setRemoteDescription(new RTCSessionDescription(data.payload.sdp))
              .then(() => pc.createAnswer())
              .then(async (answer) => {
                await pc.setLocalDescription(answer)
                sendSignal(channelId, 'answer', { sdp: answer }, data.fromUserId)
              })
              .catch(err => console.error('Error handling offer:', err))
          })

          voiceChannel.bind('answer', (data: any) => {
            if (data.targetUserId !== currentUid) return
            const pc = peerConnectionsRef.current[data.fromUserId]
            if (pc) {
              pc.setRemoteDescription(new RTCSessionDescription(data.payload.sdp))
                .catch(err => console.error('Error setting remote answer:', err))
            }
          })

          voiceChannel.bind('ice-candidate', (data: any) => {
            if (data.targetUserId !== currentUid) return
            const pc = peerConnectionsRef.current[data.fromUserId]
            if (pc && data.payload.candidate) {
              pc.addIceCandidate(new RTCIceCandidate(data.payload.candidate))
                .catch(err => console.error('Error adding ICE candidate:', err))
            }
          })

          voiceChannel.bind('user-left', (data: any) => {
            if (data.fromUserId === currentUid) return
            playLeaveSound()

            const pc = peerConnectionsRef.current[data.fromUserId]
            if (pc) {
              pc.close()
              delete peerConnectionsRef.current[data.fromUserId]
            }

            stopAudioAnalysis(data.fromUserId)
            if (remoteAudioElementsRef.current[data.fromUserId]) {
              remoteAudioElementsRef.current[data.fromUserId].pause()
              delete remoteAudioElementsRef.current[data.fromUserId]
            }

            setVoiceParticipants(prev => prev.filter(p => p.id !== data.fromUserId))
          })

          voiceChannel.bind('user-state-change', (data: any) => {
            if (data.fromUserId === currentUid) return

            setVoiceParticipants(prev => prev.map(p => {
              if (p.id === data.fromUserId) {
                return {
                  ...p,
                  isMuted: data.payload?.isMuted,
                  isDeafened: data.payload?.isDeafened,
                  isScreenSharing: data.payload?.isScreenSharing
                }
              }
              return p
            }))
          })

          sendSignal(channelId, 'user-joined', { isMuted, isDeafened, isScreenSharing })
        }
      })
      .catch(err => {
        console.error('Failed to acquire microphone access:', err)
      })
  }

  const leaveVoiceChannel = () => {
    playLeaveSound()
    if (screenStreamRef.current) {
      try {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      } catch (e) {
        console.error("Error stopping screen tracks:", e)
      }
      screenStreamRef.current = null
    }
    setIsScreenSharing(false)

    if (connectedVoiceChannel) {
      sendSignal(connectedVoiceChannel.id, 'user-left', {})
      if (pusherClient) {
        try {
          pusherClient.unsubscribe(`voice-${connectedVoiceChannel.id}`)
        } catch (e) {
          console.error("Error unsubscribing from pusher voice channel:", e)
        }
      }
    }

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      } catch (e) {
        console.error("Error stopping local stream tracks:", e)
      }
      localStreamRef.current = null
    }

    Object.keys(peerConnectionsRef.current).forEach(peerId => {
      const pc = peerConnectionsRef.current[peerId]
      if (pc) {
        try {
          pc.close()
        } catch (e) {
          console.error("Error closing peer connection for", peerId, e)
        }
      }
    })
    peerConnectionsRef.current = {}

    Object.keys(remoteAudioElementsRef.current).forEach(peerId => {
      const audio = remoteAudioElementsRef.current[peerId]
      if (audio) {
        try {
          audio.pause()
        } catch (e) {
          console.error("Error pausing remote audio element for", peerId, e)
        }
      }
    })
    remoteAudioElementsRef.current = {}

    Object.keys(audioAnalysersRef.current).forEach(peerId => {
      try {
        stopAudioAnalysis(peerId)
      } catch (e) {
        console.error("Error stopping audio analysis for", peerId, e)
      }
    })

    speakingStatesRef.current = {}
    lastSpokeTimesRef.current = {}
    setVoiceParticipants([])
  }

  const selectScreenSource = async (sourceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId
          }
        } as any
      })
      handleScreenStream(stream)
    } catch (err) {
      console.error("Failed to capture screen source:", err)
    }
  }

  const handleScreenStream = (stream: MediaStream) => {
    screenStreamRef.current = stream
    setIsScreenSharing(true)

    const videoTrack = stream.getVideoTracks()[0]
    Object.keys(peerConnectionsRef.current).forEach(peerId => {
      const pc = peerConnectionsRef.current[peerId]
      if (pc) {
        const senders = pc.getSenders()
        const sender = senders.find(s => s.track && s.track.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        } else {
          pc.addTrack(videoTrack, stream)
        }
      }
    })

    videoTrack.onended = () => {
      stopScreenShare()
    }

    setVoiceParticipants(prev => prev.map(p => {
      if (p.isLocal) {
        return { ...p, screenStream: stream }
      }
      return p
    }))
  }

  const startScreenShare = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ipc && typeof (window as any).ipc.invoke === 'function') {
        const sources = await (window as any).ipc.invoke('get-screen-sources')
        if (sources && sources.length > 0) {
          setScreenSources(sources)
          setIsScreenPickerOpen(true)
        } else {
          console.warn("No screen sources returned from main process.")
        }
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        handleScreenStream(stream)
      }
    } catch (err) {
      console.error("Failed to start screen sharing:", err)
      setIsScreenSharing(false)
    }
  }

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      try {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      } catch (e) {
        console.error("Error stopping tracks:", e)
      }

      Object.keys(peerConnectionsRef.current).forEach(peerId => {
        const pc = peerConnectionsRef.current[peerId]
        if (pc) {
          try {
            const senders = pc.getSenders()
            const sender = senders.find(s => s.track && s.track.kind === 'video')
            if (sender) {
              pc.removeTrack(sender)
            }
          } catch (e) {
            console.error("Error removing track from pc:", e)
          }
        }
      })
      screenStreamRef.current = null
    }
    setIsScreenSharing(false)
    setVoiceParticipants(prev => prev.map(p => {
      if (p.isLocal) {
        return { ...p, screenStream: null }
      }
      return p
    }))
  }

  React.useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted
      })
    }
    setVoiceParticipants(prev => prev.map(p => {
      if (p.isLocal) {
        return { ...p, isMuted, isDeafened, isScreenSharing }
      }
      return p
    }))
    if (connectedVoiceChannel) {
      sendSignal(connectedVoiceChannel.id, 'user-state-change', { isMuted, isDeafened, isScreenSharing })
    }
  }, [isMuted, isDeafened, isScreenSharing])

  React.useEffect(() => {
    Object.values(remoteAudioElementsRef.current).forEach(audio => {
      audio.muted = isDeafened
    })
  }, [isDeafened])

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      leaveVoiceChannel()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [connectedVoiceChannel])

  React.useEffect(() => {
    if (connectedVoiceChannel && connectedVoiceChannel.id) {
      joinVoiceChannel(connectedVoiceChannel.id)
    }
    return () => {
      leaveVoiceChannel()
    }
  }, [connectedVoiceChannel?.id])

  return {
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    connectedVoiceChannel,
    setConnectedVoiceChannel,
    voiceParticipants,
    isScreenSharing,
    screenSources,
    isScreenPickerOpen,
    setIsScreenPickerOpen,
    startScreenShare,
    stopScreenShare,
    selectScreenSource
  }
}
