import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Users, MessageSquare, Volume2, Edit3, Terminal, Phone, PhoneOff } from 'lucide-react'
import { CHANNEL_TYPES, DEFAULT_SERVER_ID, DM_TABS, DmTab, FRIENDS_SUB_TABS, FriendsSubTab } from '../lib/constants'
import { UserProfilePanel } from './UserProfilePanel'

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
  handleSendDm: (e: React.FormEvent) => void
  chatInput: string
  setChatInput: (input: string) => void
  handleSendMessage: (e: React.FormEvent) => void

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

  // Close panel when switching DM channels
  React.useEffect(() => { setProfilePanelOpen(false) }, [activeDmChannelId])
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                    activeFriendsSubTab === FRIENDS_SUB_TABS.ALL
                      ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFriendsSubTab(FRIENDS_SUB_TABS.PENDING)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    activeFriendsSubTab === FRIENDS_SUB_TABS.PENDING
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                    activeFriendsSubTab === FRIENDS_SUB_TABS.ADD_FRIEND
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

        {activeServerId === DEFAULT_SERVER_ID && activeDmTab === DM_TABS.CHAT && activeDmChannelId && (
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
                        <div key={msg.id} className="flex items-start space-x-2.5 hover:bg-muted/10 p-0.5 rounded transition-colors">
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
                            <p className="text-xs text-foreground/90 leading-normal break-words">{msg.content}</p>
                          </div>
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
                  <form onSubmit={handleSendDm} className="relative flex items-center bg-card border border-border rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                    <input
                      type="text"
                      value={dmInput}
                      onChange={(e) => setDmInput(e.target.value)}
                      placeholder={`Message @${dmRecipient?.fullName || 'friend'}`}
                      className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none w-full pr-10"
                    />
                    <button
                      type="submit"
                      disabled={!dmInput.trim()}
                      className="absolute right-2 bg-primary text-primary-foreground h-6 px-2.5 rounded-md text-[10px] font-bold hover:bg-primary/95 transition disabled:opacity-40 cursor-pointer"
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
                          <div className="flex items-start space-x-3.5 hover:bg-muted/20 p-1 rounded-md transition-colors cursor-pointer">
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
                              <p className="text-sm text-foreground/90 leading-relaxed break-words">{msg.content}</p>
                            </div>
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
                        <div className="flex items-start space-x-3.5 hover:bg-muted/20 p-1 rounded-md transition-colors cursor-pointer">
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
                            <p className="text-sm text-foreground/90 leading-relaxed break-words">{msg.content}</p>
                          </div>
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
        <div className="px-6 pb-6 pt-2 shrink-0">
          {activeServerId === DEFAULT_SERVER_ID ? (
            <form
              onSubmit={handleSendDm}
              className="relative flex items-center bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all"
            >
              <input
                type="text"
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
                placeholder={dmRecipient ? `Message @${dmRecipient.fullName}` : 'Message...'}
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full pr-12"
                disabled={!activeDmChannelId}
              />
              <button
                type="submit"
                disabled={!dmInput.trim() || !activeDmChannelId}
                className="absolute right-3 bg-primary text-primary-foreground h-7 px-3.5 rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                Send
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message #${activeChannelName}`}
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full pr-12"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="absolute right-3 bg-primary text-primary-foreground h-7 px-3.5 rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </main>

    {/* User Profile Panel — slides in from the right when clicking the DM recipient name */}
    {profilePanelOpen && dmRecipient && (
      <UserProfilePanel
        targetUser={dmRecipient}
        getToken={getToken}
        isClerkConfigured={isClerkConfigured}
        activeUserId={activeUserId}
        onClose={() => setProfilePanelOpen(false)}
        onStartCall={
          connectedVoiceChannel?.id !== activeDmChannelId
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
