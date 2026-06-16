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
