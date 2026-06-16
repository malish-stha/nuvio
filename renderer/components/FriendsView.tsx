
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Users, Trash2, Check, X } from 'lucide-react'

interface FriendsViewProps {
  activeFriendsSubTab: 'ALL' | 'PENDING' | 'ADD_FRIEND'
  friendsList: any[]
  pendingIncoming: any[]
  pendingOutgoing: any[]
  friendsSearchQuery: string
  friendsSearchResults: any[]
  handleStartDm: (userId: string) => void
  handleDeclineFriendRequest: (friendshipId: string) => void
  handleAcceptFriendRequest: (friendshipId: string) => void
  handleFriendsSearch: (query: string) => void
  handleSendFriendRequest: (userId: string) => void
}

export const FriendsView = ({
  activeFriendsSubTab,
  friendsList,
  pendingIncoming,
  pendingOutgoing,
  friendsSearchQuery,
  friendsSearchResults,
  handleStartDm,
  handleDeclineFriendRequest,
  handleAcceptFriendRequest,
  handleFriendsSearch,
  handleSendFriendRequest
}: FriendsViewProps) => {
  return (
    <div className="h-full w-full flex flex-col bg-background p-6 overflow-hidden select-none">
      {activeFriendsSubTab === 'ALL' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            All Friends — {friendsList.length}
          </div>
          <ScrollArea className="flex-1">
            {friendsList.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-xs">No friends yet. Head over to the "Add Friend" tab!</p>
              </div>
            ) : (
              <div className="space-y-2.5 pr-2">
                {friendsList.map(friend => (
                  <div key={friend.friendshipId} className="flex items-center justify-between p-3.5 bg-card/40 border border-border rounded-xl hover:bg-card transition duration-200">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={friend.user.imageUrl || undefined} />
                        <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                          {friend.user.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate leading-none mb-1">{friend.user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate leading-none">
                          {friend.user.bio || 'Hello there!'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleStartDm(friend.user.id)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 cursor-pointer"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => handleDeclineFriendRequest(friend.friendshipId)}
                        className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition active:scale-95 cursor-pointer border border-transparent hover:border-rose-500/20 flex items-center justify-center"
                        title="Remove Friend"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {activeFriendsSubTab === 'PENDING' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Pending Requests — {pendingIncoming.length + pendingOutgoing.length}
          </div>
          <ScrollArea className="flex-1">
            {pendingIncoming.length === 0 && pendingOutgoing.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-xs">No pending requests!</p>
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {pendingIncoming.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                      Incoming Requests ({pendingIncoming.length})
                    </div>
                    {pendingIncoming.map(req => (
                      <div key={req.friendshipId} className="flex items-center justify-between p-3 bg-card/40 border border-border rounded-xl hover:bg-card transition duration-200">
                        <div className="flex items-center space-x-3 min-w-0">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={req.user.imageUrl || undefined} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                              {req.user.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate leading-none mb-1">{req.user.fullName}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-none">{req.user.bio || 'Wants to connect!'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => handleAcceptFriendRequest(req.friendshipId)}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition active:scale-95 cursor-pointer border border-emerald-500/20 flex items-center justify-center"
                            title="Accept Request"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeclineFriendRequest(req.friendshipId)}
                            className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition active:scale-95 cursor-pointer border border-rose-500/20 flex items-center justify-center"
                            title="Decline Request"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pendingOutgoing.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                      Sent Requests ({pendingOutgoing.length})
                    </div>
                    {pendingOutgoing.map(req => (
                      <div key={req.friendshipId} className="flex items-center justify-between p-3 bg-card/40 border border-border rounded-xl hover:bg-card transition duration-200">
                        <div className="flex items-center space-x-3 min-w-0">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={req.user.imageUrl || undefined} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                              {req.user.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate leading-none mb-1">{req.user.fullName}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-none">Pending outgoing request</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeclineFriendRequest(req.friendshipId)}
                          className="px-2.5 py-1.5 bg-muted text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-border rounded-lg text-[10px] font-semibold transition active:scale-95 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {activeFriendsSubTab === 'ADD_FRIEND' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-foreground">Add Friend</h3>
            <p className="text-xs text-muted-foreground mb-4">You can add friends with their email or full name.</p>
            <div className="flex items-center bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
              <input
                type="text"
                value={friendsSearchQuery}
                onChange={(e) => handleFriendsSearch(e.target.value)}
                placeholder="Enter a username or email address..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Search Results
            </div>
            <ScrollArea className="flex-1">
              {!friendsSearchQuery.trim() ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs">Type a query to search for users to add!</p>
                </div>
              ) : friendsSearchResults.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs">No users found matching "{friendsSearchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-2.5 pr-2">
                  {friendsSearchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-card/40 border border-border rounded-xl hover:bg-card transition duration-200">
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={user.imageUrl || undefined} />
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate leading-none mb-1">{user.fullName}</p>
                          <p className="text-[10px] text-muted-foreground truncate leading-none">{user.bio || 'General User'}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {user.relationship === 'ACCEPTED' ? (
                          <button
                            onClick={() => handleStartDm(user.id)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition active:scale-95 cursor-pointer"
                          >
                            Message
                          </button>
                        ) : user.relationship === 'PENDING_SENT' ? (
                          <span className="text-[10px] font-semibold text-muted-foreground px-3 py-1.5 border border-border rounded-lg bg-muted/40">
                            Request Sent
                          </span>
                        ) : user.relationship === 'PENDING_RECEIVED' ? (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleAcceptFriendRequest(user.friendshipId)}
                              className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition active:scale-95 cursor-pointer border border-emerald-500/20 flex items-center justify-center"
                              title="Accept Request"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineFriendRequest(user.friendshipId)}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition active:scale-95 cursor-pointer border border-rose-500/20 flex items-center justify-center"
                              title="Decline Request"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
                          >
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
