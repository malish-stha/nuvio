// React namespace not explicitly used in code
import { ScrollArea } from '@/components/ui/scroll-area'
import { CHANNEL_TYPES, ChannelType, DEFAULT_SERVER_ID, DM_TABS, DmTab } from '../lib/constants'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  PlusCircle,
  ChevronDown,
  UserPlus,
  Settings,
  Trash2,
  Users,
  Plus,
  Hash,
  Volume2,
  Edit3,
  Terminal,
  MicOff,
  Mic,
  HeadphoneOff,
  Headphones,
  PhoneOff,
  Phone,
  Monitor,
  LogOut
} from 'lucide-react'

interface ChannelSidebarProps {
  activeServerId: string
  setActiveServerId: (id: string) => void
  setIsDmSearchOpen: (open: boolean) => void
  isServerMenuOpen: boolean
  setIsServerMenuOpen: (open: boolean) => void
  servers: any[]
  setIsInviteOpen: (open: boolean) => void
  activeUserId: string | null | undefined
  setEditServerName: (name: string) => void
  setEditServerImage: (image: string) => void
  setIsServerSettingsOpen: (open: boolean) => void
  handleDeleteServer: () => void
  setActiveDmChannelId: (id: string) => void
  setActiveDmTab: (tab: DmTab) => void
  activeDmTab: DmTab
  pendingIncoming: any[]
  dmChannels: any[]
  activeDmChannelId: string
  dbUser: any
  activeUserImage: string | null | undefined
  activeUserFullName: string | null | undefined
  setProfileName: (name: string) => void
  setProfileAvatar: (avatar: string) => void
  setProfileBio: (bio: string) => void
  setSettingsTab: (tab: 'profile' | 'theme') => void
  setIsSettingsOpen: (open: boolean) => void
  handleSignOut: () => void

  // Channel management props
  channels: any[]
  setChannels: (channels: any[]) => void
  setNewChannelType: (type: ChannelType) => void
  setNewChannelName: (name: string) => void
  setIsCreateChannelOpen: (open: boolean) => void
  activeChannelId: string
  setActiveChannelId: (id: string) => void
  setActiveChannelName: (name: string) => void
  setActiveChannelType: (type: string) => void
  setChannelToDelete: (channel: any) => void
  setIsDeleteChannelConfirmOpen: (open: boolean) => void

  // Voice calling footer props
  connectedVoiceChannel: any
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  isDeafened: boolean
  setIsDeafened: (deafened: boolean) => void
  setConnectedVoiceChannel: (channel: any) => void
  activeChannelType: string
  voiceParticipants: any[]
  callerWaiting?: { caller: any; dmChannelId: string } | null
}

export const ChannelSidebar = ({
  activeServerId,
  setActiveServerId,
  setIsDmSearchOpen,
  isServerMenuOpen,
  setIsServerMenuOpen,
  servers,
  setIsInviteOpen,
  activeUserId,
  setEditServerName,
  setEditServerImage,
  setIsServerSettingsOpen,
  handleDeleteServer,
  setActiveDmChannelId,
  setActiveDmTab,
  activeDmTab,
  pendingIncoming,
  dmChannels,
  activeDmChannelId,
  dbUser,
  activeUserImage,
  activeUserFullName,
  setProfileName,
  setProfileAvatar,
  setProfileBio,
  setSettingsTab,
  setIsSettingsOpen,
  handleSignOut,
  channels,
  setChannels,
  setNewChannelType,
  setNewChannelName,
  setIsCreateChannelOpen,
  activeChannelId,
  setActiveChannelId,
  setActiveChannelName,
  setActiveChannelType,
  setChannelToDelete,
  setIsDeleteChannelConfirmOpen,
  connectedVoiceChannel,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  setConnectedVoiceChannel,
  activeChannelType,
  voiceParticipants,
  callerWaiting,
}: ChannelSidebarProps) => {
  return (
    <aside className="w-60 bg-card/60 flex flex-col border-r border-border shrink-0">
      {activeServerId === DEFAULT_SERVER_ID ? (
        <div className="h-12 border-b border-border flex items-center px-4 font-bold tracking-wide shadow-sm justify-between select-none">
          <span>Direct Messages</span>
          <button
            onClick={() => setIsDmSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/40 transition cursor-pointer"
            title="Start a DM"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div
            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
            className="h-12 border-b border-border flex items-center px-4 font-bold tracking-wide shadow-sm justify-between cursor-pointer hover:bg-muted/20 select-none"
          >
            <span className="truncate">{servers.find((s) => s.id === activeServerId)?.name || 'Server'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isServerMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {isServerMenuOpen && (
            <div className="absolute top-12 left-2 right-2 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1 select-none">
              <button
                onClick={() => {
                  setIsInviteOpen(true)
                  setIsServerMenuOpen(false)
                }}
                className="w-full px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite People
              </button>
              {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                <>
                  <button
                    onClick={() => {
                      const srv = servers.find((s) => s.id === activeServerId)
                      if (srv) {
                        setEditServerName(srv.name)
                        setEditServerImage(srv.imageUrl || '')
                      }
                      setIsServerSettingsOpen(true)
                      setIsServerMenuOpen(false)
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Server Settings
                  </button>
                  <div className="h-[1px] bg-border my-1" />
                  <button
                    onClick={() => {
                      handleDeleteServer()
                      setIsServerMenuOpen(false)
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Server
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 px-2 py-3">
        {activeServerId === 'dms' ? (
          <div className="space-y-1">
            {/* Friends Button (Top of DM Sidebar) */}
            <div
              onClick={() => {
                setActiveDmChannelId('')
                setActiveDmTab(DM_TABS.FRIENDS)
              }}
              className={`px-3 py-2 rounded-xl cursor-pointer flex items-center transition select-none mb-3 ${
                activeDmTab === DM_TABS.FRIENDS
                  ? 'bg-primary/10 text-primary font-bold shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4 mr-2.5 shrink-0" />
              <span className="text-xs font-semibold">Friends</span>
              {pendingIncoming.length > 0 && (
                <span className="ml-auto bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                  {pendingIncoming.length}
                </span>
              )}
            </div>

            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 select-none">
              Direct Messages
            </div>
            {!Array.isArray(dmChannels) || dmChannels.length === 0 ? (
              <div className="text-xs text-muted-foreground/60 px-3 py-6 text-center select-none leading-relaxed">
                No active DMs. Click the icon above to message your friends!
              </div>
            ) : (
              dmChannels.map((chan) => {
                const recipient = chan.participants.find((p: any) => p.id !== activeUserId)
                if (!recipient) return null

                const isCallActiveInChan = connectedVoiceChannel?.id === chan.id
                const participant = isCallActiveInChan ? voiceParticipants.find((p: any) => p.id === recipient.id) : null
                const isRecipientInCall = !!participant

                const isRecipientMuted = participant?.isMuted
                const isRecipientDeafened = participant?.isDeafened
                const isRecipientScreenSharing = participant?.isScreenSharing

                // A is still waiting in the call lobby after B declined
                const isCallerWaiting = callerWaiting?.dmChannelId === chan.id && callerWaiting?.caller?.id === recipient.id

                return (
                  <div
                    key={chan.id}
                    onClick={() => {
                      setActiveDmChannelId(chan.id)
                      setActiveDmTab(DM_TABS.CHAT)
                    }}
                    className={`px-3 py-2 rounded-xl cursor-pointer flex items-center transition select-none ${
                      activeDmChannelId === chan.id && activeDmTab === DM_TABS.CHAT
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Avatar className={`h-6 w-6 mr-2 ${
                      isRecipientInCall 
                        ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-background' 
                        : isCallerWaiting
                          ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-background'
                          : ''
                    }`}>
                      <AvatarImage src={recipient.imageUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {recipient.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-semibold truncate leading-none mb-0.5">{recipient.fullName}</p>
                        {isRecipientInCall && (
                          <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" title="In Call" />
                        )}
                        {isCallerWaiting && !isRecipientInCall && (
                          <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 animate-ping" title="Waiting in Call" />
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground/75 truncate leading-none">
                        {isRecipientInCall
                          ? 'Connected to Call'
                          : isCallerWaiting
                            ? 'Waiting in call...'
                            : chan.lastMessage
                              ? (chan.lastMessage.sender?.id === activeUserId ? 'You: ' : '') + chan.lastMessage.content
                              : (recipient.bio || 'No messages yet')}
                      </p>
                    </div>

                    {isRecipientInCall && (
                      <div className="flex items-center space-x-1 shrink-0 ml-2 text-muted-foreground">
                        {isRecipientScreenSharing && (
                          <span title="Screen Sharing">
                            <Monitor className="h-3 w-3 text-emerald-400 animate-pulse" />
                          </span>
                        )}
                        {isRecipientDeafened ? (
                          <span title="Deafened">
                            <HeadphoneOff className="h-3 w-3 text-rose-500" />
                          </span>
                        ) : isRecipientMuted ? (
                          <span title="Muted">
                            <MicOff className="h-3 w-3 text-rose-500" />
                          </span>
                        ) : (
                          <span title="Microphone Active">
                            <Mic className="h-3 w-3 text-emerald-500" />
                          </span>
                        )}
                      </div>
                    )}

                    {isCallerWaiting && !isRecipientInCall && (
                      <div className="shrink-0 ml-2">
                        <Phone className="h-3 w-3 text-amber-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Text Channels */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none flex items-center justify-between">
                <span>Text Channels</span>
                {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setNewChannelType(CHANNEL_TYPES.TEXT)
                      setNewChannelName('')
                      setIsCreateChannelOpen(true)
                    }}
                    className="hover:text-foreground transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-0.5 mt-1">
                {channels
                  .filter((c) => c.type === CHANNEL_TYPES.TEXT)
                  .map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id)
                        setActiveChannelName(ch.name)
                        setActiveChannelType(CHANNEL_TYPES.TEXT)
                      }}
                      className={`group px-3 py-2 rounded-md font-medium text-sm cursor-pointer flex items-center justify-between transition ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center truncate mr-2">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && ch.name !== 'general' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setChannelToDelete(ch)
                            setIsDeleteChannelConfirmOpen(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition cursor-pointer p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Voice Channels */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none flex items-center justify-between">
                <span>Voice Channels</span>
                {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setNewChannelType(CHANNEL_TYPES.VOICE)
                      setNewChannelName('')
                      setIsCreateChannelOpen(true)
                    }}
                    className="hover:text-foreground transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-0.5 mt-1">
                {channels
                  .filter((c) => c.type === CHANNEL_TYPES.VOICE)
                  .map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        if (connectedVoiceChannel?.id === ch.id) {
                          setActiveChannelId(ch.id)
                          setActiveChannelName(ch.name)
                          setActiveChannelType(CHANNEL_TYPES.VOICE)
                        } else {
                          // Trigger voice join confirm modal (passed from index.tsx page)
                          // Handled via props
                          setActiveChannelId(ch.id)
                          setActiveChannelName(ch.name)
                          setActiveChannelType(CHANNEL_TYPES.VOICE)
                        }
                      }}
                      className={`group px-3 py-2 rounded-md font-medium text-sm cursor-pointer flex items-center justify-between transition ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center truncate mr-2">
                        <Volume2 className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setChannelToDelete(ch)
                            setIsDeleteChannelConfirmOpen(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition cursor-pointer p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Interactive Tools */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none flex items-center justify-between">
                <span>Interactive Tools</span>
                {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setNewChannelType(CHANNEL_TYPES.WHITEBOARD)
                      setNewChannelName('')
                      setIsCreateChannelOpen(true)
                    }}
                    className="hover:text-foreground transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-0.5 mt-1">
                {channels
                  .filter((c) => c.type === CHANNEL_TYPES.WHITEBOARD || c.type === CHANNEL_TYPES.PLAYGROUND)
                  .map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id)
                        setActiveChannelName(ch.name)
                        setActiveChannelType(ch.type || CHANNEL_TYPES.TEXT)
                      }}
                      className={`group px-3 py-2 rounded-md font-medium text-sm cursor-pointer flex items-center justify-between transition ${
                        activeChannelId === ch.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center truncate mr-2">
                        {ch.type === CHANNEL_TYPES.WHITEBOARD ? (
                          <Edit3 className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                        ) : (
                          <Terminal className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {servers.find((s) => s.id === activeServerId)?.ownerId === activeUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setChannelToDelete(ch)
                            setIsDeleteChannelConfirmOpen(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition cursor-pointer p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Voice Connected Bar */}
      {connectedVoiceChannel && (
        <div className="bg-muted/30 border-t border-border px-3 py-2 flex flex-col gap-1.5 select-none shrink-0">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                if (connectedVoiceChannel.serverId && connectedVoiceChannel.serverId !== activeServerId) {
                  setActiveServerId(connectedVoiceChannel.serverId)
                  const server = servers.find((s) => s.id === connectedVoiceChannel.serverId)
                  if (server) {
                    setChannels(server.channels || [])
                  }
                }
                setActiveChannelId(connectedVoiceChannel.id)
                setActiveChannelName(connectedVoiceChannel.name)
                setActiveChannelType(CHANNEL_TYPES.VOICE)
              }}
              className="flex items-center space-x-2 cursor-pointer group flex-1 min-w-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-emerald-400 leading-none group-hover:underline">Voice Connected</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                  {connectedVoiceChannel.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1 rounded-md transition cursor-pointer active:scale-95 flex items-center justify-center ${
                  isMuted ? 'text-rose-500 hover:bg-rose-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsDeafened(!isDeafened)}
                className={`p-1 rounded-md transition cursor-pointer active:scale-95 flex items-center justify-center ${
                  isDeafened ? 'text-rose-500 hover:bg-rose-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
              >
                {isDeafened ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  try {
                    setConnectedVoiceChannel(null)
                    if (activeChannelType === CHANNEL_TYPES.VOICE) {
                      if (channels && Array.isArray(channels) && channels.length > 0) {
                        const generalChan = channels.find((c) => c.name === 'general')
                        const fallbackChan = generalChan || channels.find((c) => c.type === CHANNEL_TYPES.TEXT) || channels[0]
                        if (fallbackChan) {
                          setActiveChannelId(fallbackChan.id)
                          setActiveChannelName(fallbackChan.name)
                          setActiveChannelType(fallbackChan.type || CHANNEL_TYPES.TEXT)
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Error in bottom status bar disconnect:', e)
                  }
                }}
                className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                title="Disconnect"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Bar */}
      <div className="h-[52px] bg-muted/50 border-t border-border flex items-center px-3 justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={dbUser?.imageUrl || activeUserImage || undefined} alt={dbUser?.fullName || activeUserFullName || ''} />
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
              {(dbUser?.fullName || activeUserFullName || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate leading-none mb-0.5 text-foreground">{dbUser?.fullName || activeUserFullName || 'Admin User'}</p>
            {dbUser?.bio ? (
              <p className="text-[9px] text-muted-foreground truncate leading-none">{dbUser.bio}</p>
            ) : (
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Owner</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => {
              setProfileName(dbUser?.fullName || activeUserFullName || '')
              setProfileAvatar(dbUser?.imageUrl || activeUserImage || '')
              setProfileBio(dbUser?.bio || '')
              setSettingsTab('profile')
              setIsSettingsOpen(true)
            }}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/40 transition cursor-pointer active:scale-95 flex items-center justify-center"
            title="Open Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer active:scale-95 flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
