
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react'
import { VideoPlayer } from './VideoPlayer'

interface VoiceRoomViewProps {
  voiceParticipants: any[]
  kickSecondsLeft: number | null
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  isDeafened: boolean
  setIsDeafened: (deafened: boolean) => void
  isScreenSharing: boolean
  startScreenShare: () => void
  stopScreenShare: () => void
  setConnectedVoiceChannel: (channel: any) => void
  channels: any[]
  setActiveChannelId: (id: string) => void
  setActiveChannelName: (name: string) => void
  setActiveChannelType: (type: string) => void
}

export const VoiceRoomView = ({
  voiceParticipants,
  kickSecondsLeft,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  isScreenSharing,
  startScreenShare,
  stopScreenShare,
  setConnectedVoiceChannel,
  channels,
  setActiveChannelId,
  setActiveChannelName,
  setActiveChannelType
}: VoiceRoomViewProps) => {
  const activeScreenShare = voiceParticipants.find(p => p.screenStream)

  return (
    <div className="h-full flex flex-col bg-muted/20 items-center justify-center p-8 select-none overflow-y-auto">
      <div className="w-full max-w-4xl flex-1 flex flex-col justify-between items-center gap-6">
        <div className="text-center w-full shrink-0">
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/20 inline-flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Connected to Voice Lounge
          </span>
          <p className="text-xs text-muted-foreground mt-2">Active participants in the channel</p>
        </div>

        {kickSecondsLeft !== null && (
          <div className="w-full max-w-md bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center shrink-0 shadow-lg backdrop-blur-sm animate-pulse">
            <p className="text-xs font-bold text-rose-400">
              Call declined. You will be disconnected in:
            </p>
            <p className="text-xl font-extrabold text-rose-500 mt-1">
              {Math.floor(kickSecondsLeft / 60)}:{(kickSecondsLeft % 60).toString().padStart(2, '0')}
            </p>
            <div className="w-full bg-[#111214] h-1.5 rounded-full overflow-hidden mt-3 border border-white/5">
              <div 
                className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(kickSecondsLeft / 180) * 100}%` }}
              />
            </div>
          </div>
        )}

        {activeScreenShare && (
          <div className="w-full max-w-3xl bg-black rounded-2xl overflow-hidden border border-border relative aspect-video flex items-center justify-center shadow-2xl shrink-0">
            <VideoPlayer stream={activeScreenShare.screenStream} />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
              <Monitor className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>{activeScreenShare.name}'s Screen</span>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center my-auto w-full gap-6 flex-wrap">
          {voiceParticipants.map(usr => (
            <div key={usr.id} className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center justify-center relative shadow-lg group hover:scale-[1.02] transition-all w-64">
              <div className="relative mb-3">
                <Avatar className={`h-20 w-20 ring-4 transition-all duration-300 ${
                  usr.isTalking 
                    ? 'ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'ring-transparent'
                }`}>
                  <AvatarImage src={usr.avatar || undefined} />
                  <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                    {usr.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {usr.isTalking && (
                  <span className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 border border-card">
                    <Mic className="h-3.5 w-3.5" />
                  </span>
                )}
                {usr.isLocal && isMuted && (
                  <span className="absolute bottom-0 right-0 bg-rose-500 text-white rounded-full p-1 border border-card">
                    <MicOff className="h-3.5 w-3.5" />
                  </span>
                )}
                {!usr.isLocal && usr.isMuted && (
                  <span className="absolute bottom-0 right-0 bg-rose-500 text-white rounded-full p-1 border border-card">
                    <MicOff className="h-3.5 w-3.5" />
                  </span>
                )}
                {usr.isLocal && isDeafened && (
                  <span className="absolute bottom-0 left-0 bg-rose-500 text-white rounded-full p-1 border border-card">
                    <HeadphoneOff className="h-3.5 w-3.5" />
                  </span>
                )}
                {!usr.isLocal && usr.isDeafened && (
                  <span className="absolute bottom-0 left-0 bg-rose-500 text-white rounded-full p-1 border border-card">
                    <HeadphoneOff className="h-3.5 w-3.5" />
                  </span>
                )}
                {usr.isScreenSharing && (
                  <span className="absolute -top-1 right-0 bg-emerald-600 text-white rounded-full p-1 border border-card animate-pulse" title="Sharing Screen">
                    <Monitor className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <span className="font-bold text-sm truncate max-w-full text-foreground">{usr.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {usr.isTalking 
                  ? 'Speaking...' 
                  : usr.isDeafened 
                    ? 'Deafened' 
                    : usr.isMuted 
                      ? 'Muted' 
                      : 'Connected'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center gap-4 shadow-xl shrink-0 mt-8">
          <button
            onClick={() => {
              try {
                setIsMuted(!isMuted)
              } catch (e) {
                console.error("Error muting mic:", e)
              }
            }}
            className={`p-3 rounded-xl transition cursor-pointer ${
              isMuted ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              try {
                setIsDeafened(!isDeafened)
              } catch (e) {
                console.error("Error deafening headphones:", e)
              }
            }}
            className={`p-3 rounded-xl transition cursor-pointer ${
              isDeafened ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title={isDeafened ? "Undeafen Headphones" : "Deafen Headphones"}
          >
            {isDeafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              try {
                if (isScreenSharing) {
                  stopScreenShare()
                } else {
                  startScreenShare()
                }
              } catch (e) {
                console.error("Error toggling screen share:", e)
              }
            }}
            className={`p-3 rounded-xl transition cursor-pointer ${
              isScreenSharing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              try {
                setConnectedVoiceChannel(null)
                if (channels && Array.isArray(channels) && channels.length > 0) {
                  const generalChan = channels.find(c => c.name === 'general')
                  const fallbackChan = generalChan || channels.find(c => c.type === 'TEXT') || channels[0]
                  if (fallbackChan) {
                    setActiveChannelId(fallbackChan.id)
                    setActiveChannelName(fallbackChan.name)
                    setActiveChannelType(fallbackChan.type || 'TEXT')
                  }
                }
              } catch (e) {
                console.error("Error in VoiceRoomView disconnect:", e)
              }
            }}
            className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer hover:rotate-90 duration-300"
            title="Disconnect Call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
