export const THEME_PRESETS = [
  { name: 'Blurple (Default)', hex: '#5865F2' },
  { name: 'Electric Indigo', hex: '#6366F1' },
  { name: 'Neon Purple', hex: '#A855F7' },
  { name: 'Fuchsia Dream', hex: '#D946EF' },
  { name: 'Cyberpunk Rose', hex: '#EC4899' },
  { name: 'Coral Rose', hex: '#F43F5E' },
  { name: 'Crimson Velvet', hex: '#EF4444' },
  { name: 'Sunset Orange', hex: '#F97316' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Terminal Green', hex: '#22C55E' },
  { name: 'Pastel Teal', hex: '#14B8A6' },
  { name: 'Steel Ocean', hex: '#0EA5E9' }
]

export const DEFAULT_ACCENT_COLOR = '#5865F2'

export const DEFAULT_SERVER_ID = 'dms'

export const CHANNEL_TYPES = {
  TEXT: 'TEXT',
  VOICE: 'VOICE',
  WHITEBOARD: 'WHITEBOARD',
  PLAYGROUND: 'PLAYGROUND'
} as const

export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES]

export const FRIENDS_SUB_TABS = {
  ALL: 'ALL',
  PENDING: 'PENDING',
  ADD_FRIEND: 'ADD_FRIEND'
} as const

export type FriendsSubTab = typeof FRIENDS_SUB_TABS[keyof typeof FRIENDS_SUB_TABS]

export const DM_TABS = {
  FRIENDS: 'friends',
  CHAT: 'chat'
} as const

export type DmTab = typeof DM_TABS[keyof typeof DM_TABS]

export const RTC_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
]

export const AUDIO_VAD_THRESHOLD = 25
export const AUDIO_VAD_HANGOVER_MS = 400
export const AUDIO_FFT_SIZE = 256

// Audio Sound Path Constants
export const SOUND_DEMON_SLAYER = '/images/sounds/Demon_Slayer_Infinity_Castle_-_Notification_Sound-655697-mobiles24.mp3'
export const SOUND_DRAGON_NOTIFICATION_3 = '/images/sounds/dragon-studio-new-notification-3-398649.mp3'
export const SOUND_DRAGON_NOTIFICATION = '/images/sounds/dragon-studio-notification-sound-effect-372475.mp3'
export const SOUND_RAVEN_CALL = '/images/sounds/freesound_community-raven-call-72946.mp3'
export const SOUND_BUBBLE_POPUP = '/images/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav'
export const SOUND_DOUBLE_BEEP = '/images/sounds/mixkit-double-beep-tone-alert-2868.wav'
export const SOUND_DRY_POPUP = '/images/sounds/mixkit-dry-pop-up-notification-alert-2356.wav'
export const SOUND_ELEVATOR_TONE = '/images/sounds/mixkit-elevator-tone-2863.wav'
export const SOUND_GAME_WAVE_ALARM = '/images/sounds/mixkit-game-notification-wave-alarm-987.wav'
export const SOUND_GAMING_LOCK = '/images/sounds/mixkit-gaming-lock-2848.wav'
export const SOUND_LONG_POP = '/images/sounds/mixkit-long-pop-2358.wav'
export const SOUND_MESSAGE_POP_ALERT = '/images/sounds/mixkit-message-pop-alert-2354.mp3'
export const SOUND_SCIFI_CLICK = '/images/sounds/mixkit-sci-fi-click-900.wav'
export const SOUND_SCIFI_CONFIRMATION = '/images/sounds/mixkit-sci-fi-confirmation-914.wav'
export const SOUND_SOFTWARE_REMOVE = '/images/sounds/mixkit-software-interface-remove-2576.wav'
export const SOUND_SOFTWARE_START = '/images/sounds/mixkit-software-interface-start-2574.wav'
export const SOUND_UNIVERSFIELD_NOTIFICATION = '/images/sounds/universfield-new-notification-040-493469.mp3'

export const SOUND_YO_PHONE_LINGING = '/images/sounds/yo_phone_linging.mp3'
export const SOUND_UNIVERSFIELD_RINGTONE = '/images/sounds/universfield-ringtone-023-376906.mp3'
