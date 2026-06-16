import {
  SOUND_DEMON_SLAYER,
  SOUND_DRAGON_NOTIFICATION_3,
  SOUND_DRAGON_NOTIFICATION,
  SOUND_RAVEN_CALL,
  SOUND_BUBBLE_POPUP,
  SOUND_DOUBLE_BEEP,
  SOUND_DRY_POPUP,
  SOUND_ELEVATOR_TONE,
  SOUND_GAME_WAVE_ALARM,
  SOUND_GAMING_LOCK,
  SOUND_LONG_POP,
  SOUND_MESSAGE_POP_ALERT,
  SOUND_SCIFI_CLICK,
  SOUND_SCIFI_CONFIRMATION,
  SOUND_SOFTWARE_REMOVE,
  SOUND_SOFTWARE_START,
  SOUND_UNIVERSFIELD_NOTIFICATION,
  SOUND_YO_PHONE_LINGING,
  SOUND_UNIVERSFIELD_RINGTONE
} from './constants'

export interface CustomSound {
  id: string
  name: string
  type: 'message' | 'ringtone'
  blob: Blob
}

export const PRESET_MESSAGE_SOUNDS = [
  { id: 'default', name: 'Demon Slayer (Default)', type: 'message' as const, src: SOUND_DEMON_SLAYER },
  { id: 'dragon_notification_3', name: 'Dragon Notification 3', type: 'message' as const, src: SOUND_DRAGON_NOTIFICATION_3 },
  { id: 'dragon_notification', name: 'Dragon Notification', type: 'message' as const, src: SOUND_DRAGON_NOTIFICATION },
  { id: 'raven_call', name: 'Raven Call', type: 'message' as const, src: SOUND_RAVEN_CALL },
  { id: 'bubble_popup', name: 'Bubble Pop-up Alert', type: 'message' as const, src: SOUND_BUBBLE_POPUP },
  { id: 'double_beep', name: 'Double Beep Alert', type: 'message' as const, src: SOUND_DOUBLE_BEEP },
  { id: 'dry_popup', name: 'Dry Pop-up Alert', type: 'message' as const, src: SOUND_DRY_POPUP },
  { id: 'elevator_tone', name: 'Elevator Tone', type: 'message' as const, src: SOUND_ELEVATOR_TONE },
  { id: 'game_wave_alarm', name: 'Game Notification Wave', type: 'message' as const, src: SOUND_GAME_WAVE_ALARM },
  { id: 'gaming_lock', name: 'Gaming Lock Alert', type: 'message' as const, src: SOUND_GAMING_LOCK },
  { id: 'long_pop', name: 'Long Pop Alert', type: 'message' as const, src: SOUND_LONG_POP },
  { id: 'message_pop_alert', name: 'Message Pop Alert', type: 'message' as const, src: SOUND_MESSAGE_POP_ALERT },
  { id: 'scifi_click', name: 'Sci-Fi Click', type: 'message' as const, src: SOUND_SCIFI_CLICK },
  { id: 'scifi_confirmation', name: 'Sci-Fi Confirmation', type: 'message' as const, src: SOUND_SCIFI_CONFIRMATION },
  { id: 'software_remove', name: 'Interface Remove Alert', type: 'message' as const, src: SOUND_SOFTWARE_REMOVE },
  { id: 'software_start', name: 'Interface Start Alert', type: 'message' as const, src: SOUND_SOFTWARE_START },
  { id: 'universfield_notification', name: 'Universfield Notification', type: 'message' as const, src: SOUND_UNIVERSFIELD_NOTIFICATION },
  { id: 'cyber', name: 'Cyber Ping (Synth)', type: 'message' as const, src: '/sounds/message_cyber.mp3' },
  { id: 'retro', name: 'Retro Bell (Synth)', type: 'message' as const, src: '/sounds/message_retro.mp3' },
  { id: 'mellow', name: 'Mellow Tap (Synth)', type: 'message' as const, src: '/sounds/message_mellow.mp3' },
  { id: 'bubble', name: 'Bubble Pop (Synth)', type: 'message' as const, src: '/sounds/message_bubble.mp3' }
]

export const PRESET_CALL_SOUNDS = [
  { id: 'default', name: 'Yo Phone Linging (Default)', type: 'ringtone' as const, src: SOUND_YO_PHONE_LINGING },
  { id: 'universfield_ringtone', name: 'Universfield Ringtone 023', type: 'ringtone' as const, src: SOUND_UNIVERSFIELD_RINGTONE },
  { id: 'classic', name: 'Classic Bell (Synth)', type: 'ringtone' as const, src: '/sounds/incoming_classic.mp3' },
  { id: 'digital', name: 'Digital Pulse (Synth)', type: 'ringtone' as const, src: '/sounds/incoming_digital.mp3' },
  { id: 'synthwave', name: 'Synthwave Glow (Synth)', type: 'ringtone' as const, src: '/sounds/incoming_synthwave.mp3' },
  { id: 'uplifting', name: 'Uplifting Melody (Synth)', type: 'ringtone' as const, src: '/sounds/incoming_uplifting.mp3' }
]

const DB_NAME = 'nuvio_custom_sounds_db'
const STORE_NAME = 'custom_sounds'

// 1. IndexedDB Helper Functions
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available in SSR environment'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const saveCustomSound = async (name: string, type: 'message' | 'ringtone', blob: Blob): Promise<CustomSound> => {
  const db = await getDB()
  const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  const sound: CustomSound = { id, name, type, blob }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(sound)
    request.onsuccess = () => resolve(sound)
    request.onerror = () => reject(request.error)
  })
}

export const getCustomSounds = async (): Promise<CustomSound[]> => {
  const db = await getDB().catch(() => null)
  if (!db) return []
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export const deleteCustomSound = async (id: string): Promise<void> => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 2. Play Audio & Web Audio API Fallbacks
let incomingRingAudio: HTMLAudioElement | null = null
let incomingRingInterval: any = null
let incomingRingContext: AudioContext | null = null
let activeIncomingBlobUrl: string | null = null

let outgoingRingAudio: HTMLAudioElement | null = null
let outgoingRingInterval: any = null
let outgoingRingContext: AudioContext | null = null

let previewAudio: HTMLAudioElement | null = null
let previewContext: AudioContext | null = null
let previewInterval: any = null
let activePreviewBlobUrl: string | null = null

// Helper to play a standard audio file URL
const playAudioFile = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    const audio = new Audio(src)
    audio.volume = 0.5

    audio.oncanplaythrough = () => {
      audio.play()
        .then(() => resolve(true))
        .catch(() => resolve(false))
    }

    audio.onerror = () => resolve(false)
  })
}

// Helper to play an audio blob and auto-cleanup Object URL
const playAudioBlob = (blob: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.volume = 0.5

    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve(true)
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }

    audio.oncanplaythrough = () => {
      audio.play()
        .then(() => resolve(true))
        .catch(() => {
          URL.revokeObjectURL(url)
          resolve(false)
        })
    }
  })
}

// Synthesized tones for Notification message presets
const playSynthesizedMessage = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0, ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.15)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.07)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.07)
    gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.085)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.07)
    osc2.stop(ctx.currentTime + 0.25)
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e)
  }
}

const playSynthesizedCyber = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e)
  }
}

const playSynthesizedRetro = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e)
  }
}

const playSynthesizedMellow = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e)
  }
}

const playSynthesizedBubble = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e)
  }
}

// 3. Play Message Notification Sound
export const playMessageSound = async () => {
  if (typeof window === 'undefined') return
  const soundId = localStorage.getItem('nuvio_sound_message') || 'default'

  if (soundId.startsWith('custom_')) {
    try {
      const sounds = await getCustomSounds()
      const match = sounds.find(s => s.id === soundId)
      if (match) {
        const success = await playAudioBlob(match.blob)
        if (success) return
      }
    } catch (e) {
      console.warn('Failed to play custom notification sound:', e)
    }
    // Fallback if custom fails
    playSynthesizedMessage()
  } else {
    const preset = PRESET_MESSAGE_SOUNDS.find(p => p.id === soundId)
    if (preset && preset.src) {
      const success = await playAudioFile(preset.src)
      if (success) return
    }

    // Synthesized presets fallback
    switch (soundId) {
      case 'cyber': playSynthesizedCyber(); break
      case 'retro': playSynthesizedRetro(); break
      case 'mellow': playSynthesizedMellow(); break
      case 'bubble': playSynthesizedBubble(); break
      default: playSynthesizedMessage(); break
    }
  }
}

// Voice lounge Join/Leave Sounds
export const playJoinSound = async () => {
  const success = await playAudioFile('/sounds/join.mp3')
  if (!success) {
    playSynthesizedJoin()
  }
}

const playSynthesizedJoin = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch (e) {
    console.warn(e)
  }
}

export const playLeaveSound = async () => {
  const success = await playAudioFile('/sounds/leave.mp3')
  if (!success) {
    playSynthesizedLeave()
  }
}

const playSynthesizedLeave = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch (e) {
    console.warn(e)
  }
}

// 4. Call Ringtone Presets Synthesizers
const playSynthesizedRingCycle = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = 400
  osc2.type = 'sine'
  osc2.frequency.value = 440
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.08, now + 0.08)
  for (let t = 0.08; t < 1.1; t += 0.06) {
    gain.gain.setValueAtTime(0.08, now + t)
    gain.gain.setValueAtTime(0.015, now + t + 0.03)
  }
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 1.25)
  osc2.stop(now + 1.25)
}

const playClassicRingCycle = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = 600
  osc2.type = 'sine'
  osc2.frequency.value = 680
  gain.gain.setValueAtTime(0, now)
  for (let t = 0.0; t < 0.8; t += 0.08) {
    gain.gain.setValueAtTime(0.08, now + t)
    gain.gain.setValueAtTime(0, now + t + 0.04)
  }
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 1.1)
  osc2.stop(now + 1.1)
}

const playDigitalRingCycle = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const notes = [800, 1000, 1200]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    const startTime = now + idx * 0.12
    const stopTime = startTime + 0.08
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.04, startTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(stopTime)
  })
}

const playSynthwaveRingCycle = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const freqs = [110, 165, 220]
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.04, now + 0.2)
    gain.gain.linearRampToValueAtTime(0.03, now + 1.0)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 2.0)
  })
}

const playUpliftingRingCycle = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const startTime = now + idx * 0.15
    const stopTime = startTime + 0.25
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(stopTime)
  })
}

const playPresetSynthesizedRingCycle = (presetId: string, ctx: AudioContext) => {
  switch (presetId) {
    case 'classic': playClassicRingCycle(ctx); break
    case 'digital': playDigitalRingCycle(ctx); break
    case 'synthwave': playSynthwaveRingCycle(ctx); break
    case 'uplifting': playUpliftingRingCycle(ctx); break
    default: playSynthesizedRingCycle(ctx); break
  }
}

// 5. Looping Incoming Call Ring Sound
export const startIncomingRing = async () => {
  if (typeof window === 'undefined') return
  stopIncomingRing()

  const soundId = localStorage.getItem('nuvio_sound_ring') || 'default'

  if (soundId.startsWith('custom_')) {
    try {
      const sounds = await getCustomSounds()
      const match = sounds.find(s => s.id === soundId)
      if (match) {
        activeIncomingBlobUrl = URL.createObjectURL(match.blob)
        incomingRingAudio = new Audio(activeIncomingBlobUrl)
        incomingRingAudio.volume = 0.4
        incomingRingAudio.loop = true

        incomingRingAudio.play().catch((err) => {
          console.warn('Custom ringtone play block fallback:', err)
          playIncomingSynthesizedFallback(soundId)
        })
        return
      }
    } catch (e) {
      console.warn(e)
    }
    playIncomingSynthesizedFallback(soundId)
  } else {
    const preset = PRESET_CALL_SOUNDS.find(p => p.id === soundId)
    if (preset && preset.src) {
      incomingRingAudio = new Audio(preset.src)
      incomingRingAudio.volume = 0.4
      incomingRingAudio.loop = true
      incomingRingAudio.play().catch(() => {
        incomingRingAudio = null
        playIncomingSynthesizedFallback(soundId)
      })
    } else {
      playIncomingSynthesizedFallback(soundId)
    }
  }
}

const playIncomingSynthesizedFallback = (presetId: string) => {
  try {
    incomingRingContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (incomingRingContext.state === 'suspended') incomingRingContext.resume()

    const playCycle = () => {
      if (!incomingRingContext) return
      playPresetSynthesizedRingCycle(presetId, incomingRingContext)
    }
    playCycle()
    incomingRingInterval = setInterval(playCycle, 3000)
  } catch (e) {
    console.warn('Web Audio ringer start failed:', e)
  }
}

export const stopIncomingRing = () => {
  if (incomingRingAudio) {
    try {
      incomingRingAudio.pause()
    } catch (e) { }
    incomingRingAudio = null
  }
  if (incomingRingInterval) {
    clearInterval(incomingRingInterval)
    incomingRingInterval = null
  }
  if (incomingRingContext) {
    try {
      incomingRingContext.close()
    } catch (e) { }
    incomingRingContext = null
  }
  if (activeIncomingBlobUrl) {
    try {
      URL.revokeObjectURL(activeIncomingBlobUrl)
    } catch (e) { }
    activeIncomingBlobUrl = null
  }
}

// 6. Outgoing Dial Tone
export const startOutgoingRing = () => {
  if (typeof window === 'undefined') return
  stopOutgoingRing()

  outgoingRingAudio = new Audio('/sounds/outgoing.mp3')
  outgoingRingAudio.volume = 0.3
  outgoingRingAudio.loop = true
  outgoingRingAudio.play().catch(() => {
    outgoingRingAudio = null
    try {
      outgoingRingContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (outgoingRingContext.state === 'suspended') outgoingRingContext.resume()

      const playCycle = () => {
        if (!outgoingRingContext) return
        playSynthesizedDialTone(outgoingRingContext)
      }
      playCycle()
      outgoingRingInterval = setInterval(playCycle, 4000)
    } catch (e) {
      console.warn(e)
    }
  })
}

export const stopOutgoingRing = () => {
  if (outgoingRingAudio) {
    try {
      outgoingRingAudio.pause()
    } catch (e) { }
    outgoingRingAudio = null
  }
  if (outgoingRingInterval) {
    clearInterval(outgoingRingInterval)
    outgoingRingInterval = null
  }
  if (outgoingRingContext) {
    try {
      outgoingRingContext.close()
    } catch (e) { }
    outgoingRingContext = null
  }
}

const playSynthesizedDialTone = (ctx: AudioContext) => {
  const now = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = 440
  osc2.type = 'sine'
  osc2.frequency.value = 480
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.06, now + 0.1)
  gain.gain.setValueAtTime(0.06, now + 1.5)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 1.75)
  osc2.stop(now + 1.75)
}

// 7. Preview Helpers for UI Sound Preferences
export const playPreviewSound = async (soundId: string, type: 'message' | 'ringtone') => {
  if (typeof window === 'undefined') return
  stopPreviewSound()

  if (type === 'message') {
    if (soundId.startsWith('custom_')) {
      try {
        const sounds = await getCustomSounds()
        const match = sounds.find(s => s.id === soundId)
        if (match) {
          activePreviewBlobUrl = URL.createObjectURL(match.blob)
          previewAudio = new Audio(activePreviewBlobUrl)
          previewAudio.volume = 0.5
          previewAudio.play().catch(() => {
            playSynthesizedCyber() // Fallback ping
          })
        }
      } catch (e) {
        console.warn(e)
      }
    } else {
      const preset = PRESET_MESSAGE_SOUNDS.find(p => p.id === soundId)
      if (preset && preset.src) {
        previewAudio = new Audio(preset.src)
        previewAudio.volume = 0.5
        previewAudio.play().catch(() => {
          // Fallback synthesizer
          switch (soundId) {
            case 'cyber': playSynthesizedCyber(); break
            case 'retro': playSynthesizedRetro(); break
            case 'mellow': playSynthesizedMellow(); break
            case 'bubble': playSynthesizedBubble(); break
            default: playSynthesizedMessage(); break
          }
        })
      }
    }
  } else {
    // Ringtone loops
    if (soundId.startsWith('custom_')) {
      try {
        const sounds = await getCustomSounds()
        const match = sounds.find(s => s.id === soundId)
        if (match) {
          activePreviewBlobUrl = URL.createObjectURL(match.blob)
          previewAudio = new Audio(activePreviewBlobUrl)
          previewAudio.volume = 0.4
          previewAudio.loop = true
          previewAudio.play().catch(() => {
            playPreviewSynthesizedRingFallback(soundId)
          })
          return
        }
      } catch (e) {
        console.warn(e)
      }
      playPreviewSynthesizedRingFallback(soundId)
    } else {
      const preset = PRESET_CALL_SOUNDS.find(p => p.id === soundId)
      if (preset && preset.src) {
        previewAudio = new Audio(preset.src)
        previewAudio.volume = 0.4
        previewAudio.loop = true
        previewAudio.play().catch(() => {
          playPreviewSynthesizedRingFallback(soundId)
        })
      } else {
        playPreviewSynthesizedRingFallback(soundId)
      }
    }
  }
}

const playPreviewSynthesizedRingFallback = (presetId: string) => {
  try {
    previewContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (previewContext.state === 'suspended') previewContext.resume()

    const playCycle = () => {
      if (!previewContext) return
      playPresetSynthesizedRingCycle(presetId, previewContext)
    }
    playCycle()
    previewInterval = setInterval(playCycle, 3000)
  } catch (e) {
    console.warn(e)
  }
}

export const stopPreviewSound = () => {
  if (previewAudio) {
    try {
      previewAudio.pause()
    } catch (e) { }
    previewAudio = null
  }
  if (previewInterval) {
    clearInterval(previewInterval)
    previewInterval = null
  }
  if (previewContext) {
    try {
      previewContext.close()
    } catch (e) { }
    previewContext = null
  }
  if (activePreviewBlobUrl) {
    try {
      URL.revokeObjectURL(activePreviewBlobUrl)
    } catch (e) { }
    activePreviewBlobUrl = null
  }
}
