import React from 'react'
import dynamic from 'next/dynamic'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Users, MessageSquare, Volume2, Edit3, Terminal, Phone, PhoneOff, Smile, Paperclip, Loader2, X, File as FileIcon, Pencil, Trash2 } from 'lucide-react'
import { CHANNEL_TYPES, DEFAULT_SERVER_ID, DM_TABS, DmTab, FRIENDS_SUB_TABS, FriendsSubTab } from '../lib/constants'
import { UserProfilePanel } from './UserProfilePanel'

const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-[340px] bg-card border border-border flex items-center justify-center rounded-2xl shadow-2xl">
        <span className="text-xs text-muted-foreground animate-pulse">Loading Emojis...</span>
      </div>
    )
  }
)

const renderAttachment = (fileUrl: string | null, onLoad?: () => void) => {
  if (!fileUrl) return null

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) != null
  const isVideo = fileUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i) != null

  if (isImage) {
    return (
      <div className="mt-1.5 w-fit max-w-[280px] rounded-lg overflow-hidden border border-border shadow-sm bg-muted/10 min-h-[50px]">
        <img
          src={fileUrl}
          alt="Shared Image/GIF"
          className="max-h-[200px] object-contain w-auto h-auto cursor-pointer hover:opacity-95 transition"
          onClick={() => window.open(fileUrl, '_blank')}
          onLoad={onLoad}
        />
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="mt-1.5 w-fit max-w-[320px] rounded-lg overflow-hidden border border-border shadow-sm bg-muted/10">
        <video
          src={fileUrl}
          controls
          className="max-h-[200px] w-full"
        />
      </div>
    )
  }

  const displayName = fileUrl.split('/').pop()?.replace(/^\d+-/, '') || 'Attachment'

  return (
    <div className="mt-1.5 flex items-center gap-3 p-2.5 bg-card border border-border rounded-xl max-w-[280px] shadow-sm select-none">
      <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
        <FileIcon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate text-foreground leading-snug">{displayName}</p>
        <p className="text-[9px] text-muted-foreground">Attachment</p>
      </div>
      <button
        onClick={() => window.open(fileUrl, '_blank')}
        className="text-primary hover:underline text-[10px] font-bold cursor-pointer transition shrink-0"
      >
        Download
      </button>
    </div>
  )
}

const isImageUrl = (url: string) => {
  return (
    url.startsWith('http://') || url.startsWith('https://')
  ) && (
      url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) != null ||
      url.includes('media.giphy.com') ||
      url.includes('giphy.com/media') ||
      url.includes('giphy.gif') ||
      url.includes('tenor.com/view')
    )
}

const renderMessageContent = (content: string, isSidePane = false, onLoad?: () => void) => {
  if (isImageUrl(content)) {
    return (
      <div className={`mt-1.5 w-fit ${isSidePane ? 'max-w-[200px]' : 'max-w-[280px]'} rounded-lg overflow-hidden border border-border shadow-sm bg-muted/10 min-h-[50px]`}>
        <img
          src={content}
          alt="Shared Image/GIF"
          className={`${isSidePane ? 'max-h-[140px]' : 'max-h-[200px]'} object-contain w-auto h-auto cursor-pointer hover:opacity-95 transition`}
          onClick={() => window.open(content, '_blank')}
          onLoad={onLoad}
        />
      </div>
    )
  }
  return (
    <p className={`${isSidePane ? 'text-xs leading-normal' : 'text-sm leading-relaxed'} text-foreground/90 break-words`}>
      {content}
    </p>
  )
}

// Sub views
import { FriendsView } from './FriendsView'
import { VoiceRoomView } from './VoiceRoomView'
import { WhiteboardView } from './WhiteboardView'
import { PlaygroundView } from './PlaygroundView'

// Discord-style "X started a call — Join the call" system row
const CallWaitingBanner = ({
  callerWaiting,
  onJoin
}: {
  callerWaiting: { caller: any; dmChannelId: string }
  onJoin: () => void
}) => (
  <div className="flex items-center gap-3 py-2 select-none group">
    <div className="h-[1px] flex-1 bg-border/60" />
    <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2 shadow-md shrink-0 transition-all group-hover:border-emerald-500/30">
      <div className="relative flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0">
        <Phone className="h-3.5 w-3.5 text-emerald-400" />
        <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-bold text-foreground">{callerWaiting.caller?.fullName || 'Someone'}</span>
        <span className="text-muted-foreground">started a call.</span>
        <span className="text-border/60 mx-0.5">—</span>
        <button
          onClick={onJoin}
          className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition cursor-pointer"
        >
          Join the call
        </button>
      </div>
    </div>
    <div className="h-[1px] flex-1 bg-border/60" />
  </div>
)

interface ChatAreaProps {
  activeServerId: string
  activeDmTab: DmTab
  setActiveDmTab: (tab: DmTab) => void
  pendingIncoming: any[]
  pendingOutgoing: any[]
  friendsList: any[]
  friendsSearchQuery: string
  friendsSearchResults: any[]
  handleStartDm: (userId: string) => void
  handleDeclineFriendRequest: (userId: string) => void
  handleAcceptFriendRequest: (userId: string) => void
  handleFriendsSearch: (query: string) => void
  handleSendFriendRequest: (userId: string) => void
  activeFriendsSubTab: FriendsSubTab
  setActiveFriendsSubTab: (tab: FriendsSubTab) => void
  dmRecipient: any
  activeChannelType: string
  activeChannelName: string
  activeDmChannelId: string
  dmMessages: any[]
  messages: any[]
  isLoading: boolean
  activeChannelId: string
  setActiveChannelId: (id: string) => void
  setActiveChannelName: (name: string) => void
  setActiveChannelType: (type: string) => void

  // Voice Lounge Props
  connectedVoiceChannel: any
  voiceParticipants: any[]
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  isDeafened: boolean
  setIsDeafened: (deafened: boolean) => void
  isScreenSharing: boolean
  startScreenShare: () => void
  stopScreenShare: () => void
  setConnectedVoiceChannel: (channel: any) => void
  channels: any[]

  // Input Forms Props
  dmInput: string
  setDmInput: (input: string) => void
  handleSendDm: (e: React.FormEvent, fileUrl?: string) => void
  chatInput: string
  setChatInput: (input: string) => void
  handleSendMessage: (e: React.FormEvent, fileUrl?: string) => void

  // Scrolling Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  dmMessagesEndRef: React.RefObject<HTMLDivElement | null>
  kickSecondsLeft: number | null
  // Caller waiting in lobby (shown as system message in DM chat)
  callerWaiting?: { caller: any; dmChannelId: string } | null
  // Auth for profile panel
  getToken: () => Promise<string | null>
  isClerkConfigured: boolean
  activeUserId: string
  onFriendshipChange?: () => void
}

export const ChatArea = ({
  activeServerId,
  activeDmTab,
  pendingIncoming,
  pendingOutgoing,
  friendsList,
  friendsSearchQuery,
  friendsSearchResults,
  handleStartDm,
  handleDeclineFriendRequest,
  handleAcceptFriendRequest,
  handleFriendsSearch,
  handleSendFriendRequest,
  activeFriendsSubTab,
  setActiveFriendsSubTab,
  dmRecipient,
  activeChannelType,
  activeChannelName,
  activeDmChannelId,
  dmMessages,
  messages,
  isLoading,
  activeChannelId,
  setActiveChannelId,
  setActiveChannelName,
  setActiveChannelType,
  connectedVoiceChannel,
  voiceParticipants,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  isScreenSharing,
  startScreenShare,
  stopScreenShare,
  setConnectedVoiceChannel,
  channels,
  dmInput,
  setDmInput,
  handleSendDm,
  chatInput,
  setChatInput,
  handleSendMessage,
  messagesEndRef,
  dmMessagesEndRef,
  kickSecondsLeft,
  callerWaiting,
  getToken,
  isClerkConfigured,
  activeUserId,
  onFriendshipChange
}: ChatAreaProps) => {
  const [profilePanelOpen, setProfilePanelOpen] = React.useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = React.useState(false)
  const [gifPickerOpen, setGifPickerOpen] = React.useState(false)
  const [gifSearch, setGifSearch] = React.useState('')
  const [gifSearchResults, setGifSearchResults] = React.useState<any[]>([])

  const [attachment, setAttachment] = React.useState<{ url: string; name: string; type: string } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
  const [editInput, setEditInput] = React.useState('')

  const emojiPickerRef = React.useRef<HTMLDivElement>(null)
  const gifPickerRef = React.useRef<HTMLDivElement>(null)

  const handleEditMessage = async (messageId: string, isDm: boolean) => {
    if (!editInput.trim()) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const endpoint = isDm ? '/api/dms/messages' : '/api/messages'
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          content: editInput
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to edit message.')
      }

      setEditingMessageId(null)
      setEditInput('')
    } catch (err: any) {
      console.error('Error editing message:', err)
      alert(err.message || 'Failed to edit message.')
    }
  }

  const handleDeleteMessage = async (messageId: string, isDm: boolean) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const endpoint = isDm 
        ? `/api/dms/messages?messageId=${messageId}` 
        : `/api/messages?messageId=${messageId}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to delete message.')
      }
    } catch (err: any) {
      console.error('Error deleting message:', err)
      alert(err.message || 'Failed to delete message.')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const token = isClerkConfigured ? await getToken() : 'mock-token'
          const base64Data = reader.result as string
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData: base64Data
            })
          })

          if (!res.ok) {
            throw new Error(await res.text())
          }

          const data = await res.json()
          setAttachment({
            url: data.fileUrl,
            name: file.name,
            type: file.type
          })
        } catch (err) {
          console.error('File upload api error:', err)
          alert('Failed to upload file.')
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('File reader error:', err)
      setIsUploading(false)
    }
  }

  const renderAttachmentPreview = () => {
    if (isUploading) {
      return (
        <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl mb-3 animate-pulse shadow-sm w-fit min-w-[200px]">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">Uploading file...</span>
        </div>
      )
    }

    if (!attachment) return null

    const isImage = attachment.type.startsWith('image/')
    const isVideo = attachment.type.startsWith('video/')

    return (
      <div className="relative flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-3 max-w-[280px] shadow-md group">
        <button
          type="button"
          onClick={() => setAttachment(null)}
          className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer z-10"
        >
          <X className="h-3 w-3" />
        </button>

        {isImage ? (
          <div className="h-14 w-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
            <img src={attachment.url} alt="Upload preview" className="h-full w-full object-cover" />
          </div>
        ) : isVideo ? (
          <div className="h-14 w-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center relative">
            <video src={attachment.url} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-[10px] text-white font-bold uppercase">Video</span>
            </div>
          </div>
        ) : (
          <div className="h-14 w-14 rounded-lg border border-border shrink-0 bg-primary/10 flex items-center justify-center text-primary">
            <FileIcon className="h-6 w-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate pr-2 text-foreground">{attachment.name}</p>
          <p className="text-[10px] text-muted-foreground">Ready to send</p>
        </div>
      </div>
    )
  }

  // Click outside to close pickers
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false)
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(e.target as Node)) {
        setGifPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  React.useEffect(() => {
    if (!gifPickerOpen) return

    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || ''
    if (!apiKey) return

    const fetchGifs = async () => {
      try {
        const url = !gifSearch.trim()
          ? `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=16&rating=g`
          : `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(gifSearch)}&limit=16&rating=g`
        const res = await fetch(url)
        const data = await res.json()
        if (data && data.data) {
          const results = data.data.map((gif: any) => ({
            title: gif.title || 'Giphy',
            url: `https://i.giphy.com/${gif.id}.gif`,
            tags: gif.slug || ''
          }))
          setGifSearchResults(results)
        }
      } catch (err) {
        console.error('Failed to fetch Giphy:', err)
      }
    }

    if (!gifSearch.trim()) {
      fetchGifs()
      return
    }

    const delayDebounceFn = setTimeout(fetchGifs, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [gifSearch, gifPickerOpen])

  const handleEmojiSelect = (emojiChar: string) => {
    if (activeServerId === DEFAULT_SERVER_ID) {
      setDmInput(dmInput + emojiChar)
    } else {
      setChatInput(chatInput + emojiChar)
    }
  }

  const sendCustomMessage = async (content: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      if (activeServerId === DEFAULT_SERVER_ID) {
        // Send DM
        if (!activeDmChannelId) return
        await fetch('/api/dms/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content,
            dmChannelId: activeDmChannelId
          })
        })
      } else {
        // Send Channel Message
        if (!activeChannelId) return
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content,
            channelId: activeChannelId
          })
        })
      }
    } catch (err) {
      console.error('Failed to send custom message:', err)
    }
  }

  // Close panel when switching DM channels
  React.useEffect(() => { setProfilePanelOpen(false) }, [activeDmChannelId])

  const isFriend = friendsList.some(f => f.user?.id === dmRecipient?.id)

  return (
    <>
      <main className="flex-1 flex flex-col bg-background">
        <header className="h-12 border-b border-border flex items-center px-6 font-semibold shadow-sm justify-between shrink-0">
          <div className="flex items-center space-x-2 select-none">
            {activeServerId === DEFAULT_SERVER_ID ? (
              activeDmTab === DM_TABS.FRIENDS ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 mr-2 text-foreground select-none">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-extrabold text-sm">Friends</span>
                  </div>
                  <div className="h-4 w-[1px] bg-border" />
                  <button
                    onClick={() => setActiveFriendsSubTab(FRIENDS_SUB_TABS.ALL)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${activeFriendsSubTab === FRIENDS_SUB_TABS.ALL
                      ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFriendsSubTab(FRIENDS_SUB_TABS.PENDING)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${activeFriendsSubTab === FRIENDS_SUB_TABS.PENDING
                      ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                      }`}
                  >
                    <span>Pending</span>
                    {pendingIncoming.length + pendingOutgoing.length > 0 && (
                      <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                        {pendingIncoming.length + pendingOutgoing.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveFriendsSubTab(FRIENDS_SUB_TABS.ADD_FRIEND)
                      handleFriendsSearch('')
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${activeFriendsSubTab === FRIENDS_SUB_TABS.ADD_FRIEND
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 font-bold'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold'
                      }`}
                  >
                    Add Friend
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setProfilePanelOpen(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer group"
                    title="View profile"
                  >
                    <Avatar className="h-6 w-6 ring-2 ring-primary/20 group-hover:ring-primary/50 transition">
                      <AvatarImage src={dmRecipient?.imageUrl || undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-extrabold">
                        {(dmRecipient?.fullName || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground font-semibold text-lg leading-none">@</span>
                    <span className="font-bold group-hover:underline">{dmRecipient ? dmRecipient.fullName : 'Direct Messages'}</span>
                  </button>
                  {dmRecipient?.bio && (
                    <span className="text-xs text-muted-foreground font-normal ml-2 truncate max-w-[240px]">
                      — {dmRecipient.bio}
                    </span>
                  )}
                </>
              )
            ) : (
              <>
                {activeChannelType === CHANNEL_TYPES.VOICE ? (
                  <Volume2 className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                ) : activeChannelType === CHANNEL_TYPES.WHITEBOARD ? (
                  <Edit3 className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                ) : activeChannelType === CHANNEL_TYPES.PLAYGROUND ? (
                  <Terminal className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                ) : (
                  <span className="text-muted-foreground font-semibold text-lg shrink-0">#</span>
                )}
                <span>{activeChannelName}</span>
              </>
            )}
          </div>

          {activeServerId === DEFAULT_SERVER_ID && activeDmTab === DM_TABS.CHAT && activeDmChannelId && isFriend && (
            <div className="flex items-center space-x-2 select-none">
              {connectedVoiceChannel?.id === activeDmChannelId ? (
                <button
                  onClick={() => setConnectedVoiceChannel(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-rose-600/10"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  <span>End Call</span>
                </button>
              ) : (
                <button
                  onClick={() => setConnectedVoiceChannel({ id: activeDmChannelId, name: dmRecipient?.fullName || 'Call', serverId: 'dms' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Messages Log */}
        <div className="flex-1 relative overflow-hidden">
          {activeServerId === DEFAULT_SERVER_ID && activeDmTab === DM_TABS.FRIENDS ? (
            <FriendsView
              activeFriendsSubTab={activeFriendsSubTab}
              friendsList={friendsList}
              pendingIncoming={pendingIncoming}
              pendingOutgoing={pendingOutgoing}
              friendsSearchQuery={friendsSearchQuery}
              friendsSearchResults={friendsSearchResults}
              handleStartDm={handleStartDm}
              handleDeclineFriendRequest={handleDeclineFriendRequest}
              handleAcceptFriendRequest={handleAcceptFriendRequest}
              handleFriendsSearch={handleFriendsSearch}
              handleSendFriendRequest={handleSendFriendRequest}
            />
          ) : activeServerId === DEFAULT_SERVER_ID ? (
            !activeDmChannelId ? (
              <ScrollArea className="h-full w-full px-6 py-4">
                <div className="h-full flex flex-col items-center justify-center text-center px-6 text-sm text-muted-foreground select-none">
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="absolute h-20 w-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-transform duration-300 hover:scale-105">
                      <MessageSquare className="h-10 w-10 text-primary stroke-[1.5]" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">Direct Messages</h3>
                  <p className="max-w-[280px] text-xs leading-relaxed">
                    Select a DM conversation or click the plus button on the sidebar to search for users!
                  </p>
                </div>
              </ScrollArea>
            ) : connectedVoiceChannel?.id === activeDmChannelId ? (
              <div className="flex flex-col md:flex-row divide-x divide-border h-full overflow-hidden select-none">
                {/* Left Column: Call / Stream Grid */}
                <div className="flex-1 h-full overflow-hidden bg-background/50 flex flex-col">
                  <VoiceRoomView
                    voiceParticipants={voiceParticipants}
                    kickSecondsLeft={kickSecondsLeft}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    isDeafened={isDeafened}
                    setIsDeafened={setIsDeafened}
                    isScreenSharing={isScreenSharing}
                    startScreenShare={startScreenShare}
                    stopScreenShare={stopScreenShare}
                    setConnectedVoiceChannel={setConnectedVoiceChannel}
                    channels={channels}
                    setActiveChannelId={setActiveChannelId}
                    setActiveChannelName={setActiveChannelName}
                    setActiveChannelType={setActiveChannelType}
                  />
                </div>

                {/* Right Column: Chat timeline side pane */}
                <div className="w-[320px] flex flex-col h-full bg-[#1e1f22]/20 shrink-0 overflow-hidden border-l border-border">
                  <ScrollArea className="flex-1 w-full px-4 py-3">
                    {dmMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                        No messages yet. Send a message to start chatting!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dmMessages.map((msg) => (
                          <div key={msg.id} className="flex items-start space-x-2.5 hover:bg-muted/10 p-0.5 rounded transition-colors group relative">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={msg.sender?.imageUrl || undefined} />
                              <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                                {(msg.sender?.fullName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-baseline space-x-1.5">
                                <span className="text-[10px] font-bold hover:underline truncate max-w-[110px]">
                                  {msg.sender?.fullName || 'Anonymous'}
                                </span>
                                <span className="text-[8px] text-muted-foreground font-medium shrink-0">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {editingMessageId === msg.id ? (
                                <div className="mt-1 w-full">
                                  <input
                                    type="text"
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditMessage(msg.id, true)
                                      } else if (e.key === 'Escape') {
                                        setEditingMessageId(null)
                                        setEditInput('')
                                      }
                                    }}
                                    className="w-full bg-background border border-primary/40 rounded px-1.5 py-0.5 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                  />
                                  <p className="text-[8px] text-muted-foreground mt-0.5 select-none">
                                    esc to cancel · enter to save
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {renderMessageContent(msg.content, true, () => dmMessagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                  {msg.fileUrl && renderAttachment(msg.fileUrl, () => dmMessagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                </>
                              )}
                            </div>
                            {msg.senderId === activeUserId && editingMessageId !== msg.id && (
                              <div className="absolute right-2 top-0.5 bg-card border border-border rounded shadow-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition flex items-center space-x-1.5 shrink-0 z-10 select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setEditingMessageId(msg.id)
                                    setEditInput(msg.content)
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="p-0.5 hover:text-primary transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                  title="Edit message"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteMessage(msg.id, true)
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="p-0.5 hover:text-rose-500 transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Call waiting system message — split pane side chat */}
                        {callerWaiting?.dmChannelId === activeDmChannelId && (
                          <div className="flex items-center gap-2 py-1 px-1 select-none">
                            <div className="h-[1px] flex-1 bg-emerald-500/20" />
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 shrink-0">
                              <Phone className="h-3 w-3 text-emerald-400 animate-pulse shrink-0" />
                              <span className="text-[10px] text-emerald-300 font-semibold">
                                {callerWaiting.caller?.fullName} started a call
                              </span>
                            </div>
                            <div className="h-[1px] flex-1 bg-emerald-500/20" />
                          </div>
                        )}

                        <div ref={dmMessagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Chat input for split view */}
                  <div className="p-3 border-t border-border shrink-0 bg-[#1e1f22]/40">
                    <form onSubmit={handleSendDm} className="flex items-center bg-card border border-border rounded-lg px-3 py-1 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all gap-2">
                      <input
                        type="text"
                        value={dmInput}
                        onChange={(e) => setDmInput(e.target.value)}
                        placeholder={`Message @${dmRecipient?.fullName || 'friend'}`}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none min-w-0"
                      />
                      <button
                        type="submit"
                        disabled={!dmInput.trim()}
                        className="bg-primary text-primary-foreground h-6 px-2.5 rounded-md text-[10px] font-bold hover:bg-primary/95 transition disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full w-full px-6 py-4">
                {dmMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-end pb-8">
                    <Avatar className="h-16 w-16 mb-4 ring-4 ring-primary/10">
                      <AvatarImage src={dmRecipient?.imageUrl || undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                        {(dmRecipient?.fullName || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-extrabold mb-1">{dmRecipient?.fullName}</h2>
                    <p className="text-sm text-muted-foreground">
                      This is the beginning of your direct message history with {dmRecipient?.fullName}.
                    </p>

                    {/* Call waiting system message — empty chat */}
                    {callerWaiting?.dmChannelId === activeDmChannelId && (
                      <CallWaitingBanner
                        callerWaiting={callerWaiting}
                        onJoin={() => setConnectedVoiceChannel({ id: callerWaiting.dmChannelId, name: callerWaiting.caller?.fullName || 'Call', serverId: 'dms' })}
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dmMessages.map((msg) => (
                      <Tooltip key={msg.id}>
                        <TooltipTrigger
                          render={
                            <div className="flex items-start space-x-3.5 hover:bg-muted/20 p-1 rounded-md transition-colors cursor-pointer group relative">
                              <Avatar className="h-9 w-9 mt-0.5">
                                <AvatarImage src={msg.sender?.imageUrl || undefined} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-extrabold">
                                  {(msg.sender?.fullName || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-xs font-bold hover:underline">{msg.sender?.fullName || 'Anonymous'}</span>
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {editingMessageId === msg.id ? (
                                  <div className="mt-1 w-full max-w-[500px]">
                                    <input
                                      type="text"
                                      value={editInput}
                                      onChange={(e) => setEditInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditMessage(msg.id, true)
                                        } else if (e.key === 'Escape') {
                                          setEditingMessageId(null)
                                          setEditInput('')
                                        }
                                      }}
                                      className="w-full bg-background border border-primary/40 rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                      autoFocus
                                    />
                                    <p className="text-[9px] text-muted-foreground mt-1 select-none">
                                      escape to cancel · enter to save
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {renderMessageContent(msg.content, false, () => dmMessagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                    {msg.fileUrl && renderAttachment(msg.fileUrl, () => dmMessagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                  </>
                                )}
                              </div>
                              {msg.senderId === activeUserId && editingMessageId !== msg.id && (
                                <div className="absolute right-2 top-1.5 bg-card border border-border rounded-lg shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition flex items-center space-x-2 shrink-0 z-10 select-none">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEditingMessageId(msg.id)
                                      setEditInput(msg.content)
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1 hover:text-primary transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                    title="Edit message"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteMessage(msg.id, true)
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1 hover:text-rose-500 transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          }
                        />
                        {msg.sender?.bio && (
                          <TooltipContent side="right" className="max-w-[200px] break-words">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">User Bio</p>
                            <p className="text-xs">{msg.sender.bio}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}

                    {/* Call waiting system message — inline in message list */}
                    {callerWaiting?.dmChannelId === activeDmChannelId && (
                      <CallWaitingBanner
                        callerWaiting={callerWaiting}
                        onJoin={() => setConnectedVoiceChannel({ id: callerWaiting.dmChannelId, name: callerWaiting.caller?.fullName || 'Call', serverId: 'dms' })}
                      />
                    )}

                    <div ref={dmMessagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            )
          ) : activeChannelType === CHANNEL_TYPES.VOICE ? (
            <VoiceRoomView
              voiceParticipants={voiceParticipants}
              kickSecondsLeft={kickSecondsLeft}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              isDeafened={isDeafened}
              setIsDeafened={setIsDeafened}
              isScreenSharing={isScreenSharing}
              startScreenShare={startScreenShare}
              stopScreenShare={stopScreenShare}
              setConnectedVoiceChannel={setConnectedVoiceChannel}
              channels={channels}
              setActiveChannelId={setActiveChannelId}
              setActiveChannelName={setActiveChannelName}
              setActiveChannelType={setActiveChannelType}
            />
          ) : activeChannelType === CHANNEL_TYPES.WHITEBOARD ? (
            <WhiteboardView />
          ) : activeChannelType === CHANNEL_TYPES.PLAYGROUND ? (
            <PlaygroundView />
          ) : (
            <ScrollArea className="h-full w-full px-6 py-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground select-none">
                  Loading workspace...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col justify-end pb-8">
                  <div className="bg-primary/10 h-16 w-16 rounded-3xl flex items-center justify-center text-primary text-3xl font-bold mb-4 shadow-lg shadow-primary/5 select-none">
                    #
                  </div>
                  <h2 className="text-2xl font-extrabold mb-1">Welcome to #{activeChannelName}!</h2>
                  <p className="text-sm text-muted-foreground">This is the start of the #{activeChannelName} channel.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <Tooltip key={msg.id}>
                      <TooltipTrigger
                        render={
                          <div className="flex items-start space-x-3.5 hover:bg-muted/20 p-1 rounded-md transition-colors cursor-pointer group relative">
                            <Avatar className="h-9 w-9 mt-0.5">
                              <AvatarImage src={msg.member?.user?.imageUrl || undefined} />
                              <AvatarFallback className="bg-primary/15 text-primary text-xs font-extrabold">
                                {(msg.member?.user?.fullName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-xs font-bold hover:underline">{msg.member?.user?.fullName || 'Anonymous'}</span>
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {editingMessageId === msg.id ? (
                                <div className="mt-1 w-full max-w-[500px]">
                                  <input
                                    type="text"
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditMessage(msg.id, false)
                                      } else if (e.key === 'Escape') {
                                        setEditingMessageId(null)
                                        setEditInput('')
                                      }
                                    }}
                                    className="w-full bg-background border border-primary/40 rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                  />
                                  <p className="text-[9px] text-muted-foreground mt-1 select-none">
                                    escape to cancel · enter to save
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {renderMessageContent(msg.content, false, () => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                  {msg.fileUrl && renderAttachment(msg.fileUrl, () => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }))}
                                </>
                              )}
                            </div>
                            {(msg.member?.userId === activeUserId || msg.member?.user?.id === activeUserId) && editingMessageId !== msg.id && (
                              <div className="absolute right-2 top-1.5 bg-card border border-border rounded-lg shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition flex items-center space-x-2 shrink-0 z-10 select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setEditingMessageId(msg.id)
                                    setEditInput(msg.content)
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="p-1 hover:text-primary transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                  title="Edit message"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteMessage(msg.id, false)
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="p-1 hover:text-rose-500 transition hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        }
                      />
                      {msg.member?.user?.bio && (
                        <TooltipContent side="right" className="max-w-[200px] break-words">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">User Bio</p>
                          <p className="text-xs">{msg.member.user.bio}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Chat Form Input */}
        {((activeServerId === DEFAULT_SERVER_ID && activeDmTab === DM_TABS.CHAT && connectedVoiceChannel?.id !== activeDmChannelId) || (activeServerId !== DEFAULT_SERVER_ID && activeChannelType === CHANNEL_TYPES.TEXT)) && (
          <div className="px-6 pb-6 pt-2 shrink-0 relative">
            {/* Emoji Picker Popover */}
            {emojiPickerOpen && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-16 right-6 z-50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <EmojiPicker
                  theme={"dark" as any}
                  emojiStyle={"native" as any}
                  width={340}
                  height={400}
                  onEmojiClick={(emojiData) => {
                    handleEmojiSelect(emojiData.emoji)
                    setEmojiPickerOpen(false)
                  }}
                />
              </div>
            )}

            {/* GIF Picker Popover */}
            {gifPickerOpen && (
              <div
                ref={gifPickerRef}
                className="absolute bottom-16 right-6 z-50 w-80 h-[360px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="p-3 border-b border-border shrink-0">
                  <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 no-scrollbar">
                  {gifSearchResults.map((gif) => (
                    <button
                      type="button"
                      key={gif.url}
                      onClick={() => {
                        sendCustomMessage(gif.url)
                        setGifPickerOpen(false)
                      }}
                      className="relative h-24 rounded-lg overflow-hidden border border-border hover:border-primary/40 hover:opacity-90 active:scale-95 transition cursor-pointer select-none"
                      title={gif.title}
                    >
                      <img src={gif.url} alt={gif.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
                        <p className="text-[9px] text-white font-bold truncate leading-none">{gif.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {renderAttachmentPreview()}

            {activeServerId === DEFAULT_SERVER_ID ? (
              <form
                onSubmit={(e) => {
                  handleSendDm(e, attachment?.url || undefined)
                  setAttachment(null)
                }}
                className="flex items-center bg-card border border-border rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all gap-3"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer select-none active:scale-95 shrink-0"
                  title="Upload file/media"
                  disabled={isUploading}
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder={dmRecipient ? `Message @${dmRecipient.fullName}` : 'Message...'}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none min-w-0"
                  disabled={!activeDmChannelId}
                />
                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGifPickerOpen(true)
                      setEmojiPickerOpen(false)
                    }}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded border border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition cursor-pointer select-none active:scale-95 bg-muted/20"
                  >
                    GIF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiPickerOpen(true)
                      setGifPickerOpen(false)
                    }}
                    className="text-muted-foreground hover:text-foreground transition cursor-pointer select-none active:scale-95"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={(!dmInput.trim() && !attachment) || !activeDmChannelId}
                    className="bg-primary text-primary-foreground h-7 px-3.5 rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  handleSendMessage(e, attachment?.url || undefined)
                  setAttachment(null)
                }}
                className="flex items-center bg-card border border-border rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all gap-3"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer select-none active:scale-95 shrink-0"
                  title="Upload file/media"
                  disabled={isUploading}
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message #${activeChannelName}`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none min-w-0"
                />
                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGifPickerOpen(true)
                      setEmojiPickerOpen(false)
                    }}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded border border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition cursor-pointer select-none active:scale-95 bg-muted/20"
                  >
                    GIF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiPickerOpen(true)
                      setGifPickerOpen(false)
                    }}
                    className="text-muted-foreground hover:text-foreground transition cursor-pointer select-none active:scale-95"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() && !attachment}
                    className="bg-primary text-primary-foreground h-7 px-3.5 rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
      />

      {/* User Profile Panel — slides in from the right when clicking the DM recipient name */}
      {profilePanelOpen && dmRecipient && (
        <UserProfilePanel
          targetUser={dmRecipient}
          getToken={getToken}
          isClerkConfigured={isClerkConfigured}
          activeUserId={activeUserId}
          onClose={() => setProfilePanelOpen(false)}
          onStartCall={
            isFriend && connectedVoiceChannel?.id !== activeDmChannelId
              ? () => {
                setConnectedVoiceChannel({ id: activeDmChannelId, name: dmRecipient.fullName || 'Call', serverId: 'dms' })
                setProfilePanelOpen(false)
              }
              : undefined
          }
          onFriendshipChange={onFriendshipChange}
        />
      )}
    </>
  )
}
