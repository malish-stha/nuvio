import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { X, UserMinus, ShieldBan, UserPlus, Phone } from 'lucide-react'

interface UserProfilePanelProps {
  targetUser: { id: string; fullName: string; imageUrl?: string | null; bio?: string | null } | null
  getToken: () => Promise<string | null>
  isClerkConfigured: boolean
  activeUserId: string
  onClose: () => void
  onStartCall?: () => void
  onFriendshipChange?: () => void
}

type FriendshipState =
  | { status: 'ACCEPTED'; id: string }
  | { status: 'PENDING'; id: string; isSender: boolean }
  | { status: 'BLOCKED'; id: string; isSender: boolean }
  | null

const statusColors: Record<string, string> = {
  ACCEPTED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PENDING:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  BLOCKED:  'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

export const UserProfilePanel = ({
  targetUser,
  getToken,
  isClerkConfigured,
  activeUserId,
  onClose,
  onStartCall,
  onFriendshipChange
}: UserProfilePanelProps) => {
  const [friendship, setFriendship] = React.useState<FriendshipState>(null)
  const [loading, setLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch friendship status whenever targetUser changes
  React.useEffect(() => {
    if (!targetUser) return
    const fetch_ = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        const res = await fetch(`/api/friends/manage?targetUserId=${targetUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setFriendship(data.friendship
          ? { status: data.friendship.status, id: data.friendship.id, isSender: data.friendship.isSender }
          : null)
      } catch (e: any) {
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [targetUser?.id])

  const getAuthHeaders = async () => {
    const token = isClerkConfigured ? await getToken() : 'mock-token'
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  }

  const handleUnfriend = async () => {
    if (!friendship || friendship.status !== 'ACCEPTED') return
    setActionLoading('unfriend')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/friends/manage', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ friendshipId: friendship.id, targetUserId: targetUser?.id })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setFriendship(null)
      onFriendshipChange?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlock = async () => {
    if (!targetUser) return
    setActionLoading('block')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/friends/manage', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'block',
          targetUserId: targetUser.id,
          friendshipId: friendship?.id
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFriendship({ status: 'BLOCKED', id: data.friendship?.id || '', isSender: true })
      onFriendshipChange?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblock = async () => {
    if (!friendship || friendship.status !== 'BLOCKED') return
    setActionLoading('unblock')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/friends/manage', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ friendshipId: friendship.id })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setFriendship(null)
      onFriendshipChange?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!targetUser) return
    setActionLoading('addFriend')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiverId: targetUser.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFriendship({ status: 'PENDING', id: data.friendship?.id || '', isSender: true })
      onFriendshipChange?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsendRequest = async () => {
    if (!friendship || friendship.status !== 'PENDING') return
    setActionLoading('unsend')
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/friends/manage', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ friendshipId: friendship.id })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setFriendship(null)
      onFriendshipChange?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (!targetUser) return null

  const initials = targetUser.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const friendshipLabel =
    friendship?.status === 'ACCEPTED' ? 'Friends'
    : friendship?.status === 'PENDING' && friendship.isSender ? 'Request Sent'
    : friendship?.status === 'PENDING' ? 'Request Received'
    : friendship?.status === 'BLOCKED' ? 'Blocked'
    : 'Not Friends'

  const friendshipClass = friendship?.status
    ? statusColors[friendship.status] ?? 'bg-muted/50 text-muted-foreground border-border'
    : 'bg-muted/50 text-muted-foreground border-border'

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative h-full w-80 bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient banner */}
        <div className="h-28 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent shrink-0" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Avatar — overlaps banner */}
        <div className="px-5 -mt-12 shrink-0">
          <Avatar className="h-20 w-20 ring-4 ring-card shadow-xl">
            <AvatarImage src={targetUser.imageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-extrabold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="px-5 mt-3 flex flex-col gap-1 shrink-0">
          <h2 className="text-lg font-extrabold leading-tight truncate">{targetUser.fullName}</h2>

          {/* Friendship badge */}
          {loading ? (
            <span className="text-[10px] text-muted-foreground animate-pulse">Loading status…</span>
          ) : (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${friendshipClass}`}>
              {friendshipLabel}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-5 my-4 shrink-0" />

        {/* Bio */}
        {targetUser.bio && (
          <div className="px-5 mb-4 shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">About Me</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{targetUser.bio}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mx-5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="px-5 flex flex-col gap-2 shrink-0">
          {/* Call */}
          {onStartCall && (
            <button
              onClick={onStartCall}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Phone className="h-4 w-4" />
              Start Voice Call
            </button>
          )}

          {/* Friend-specific actions */}
          {!loading && friendship?.status === 'ACCEPTED' && (
            <button
              onClick={handleUnfriend}
              disabled={actionLoading === 'unfriend'}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <UserMinus className="h-4 w-4 text-rose-400" />
              {actionLoading === 'unfriend' ? 'Removing…' : 'Unfriend'}
            </button>
          )}

          {!loading && !friendship && (
            <button
              onClick={handleSendFriendRequest}
              disabled={actionLoading === 'addFriend'}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {actionLoading === 'addFriend' ? 'Sending…' : 'Send Friend Request'}
            </button>
          )}

          {!loading && friendship?.status === 'PENDING' && friendship.isSender && (
            <button
              onClick={handleUnsendRequest}
              disabled={actionLoading === 'unsend'}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <UserMinus className="h-4 w-4" />
              {actionLoading === 'unsend' ? 'Canceling…' : 'Cancel Friend Request'}
            </button>
          )}

          {/* Block (only show if not already blocked) */}
          {!loading && friendship?.status !== 'BLOCKED' && (
            <button
              onClick={handleBlock}
              disabled={actionLoading === 'block'}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ShieldBan className="h-4 w-4" />
              {actionLoading === 'block' ? 'Blocking…' : 'Block'}
            </button>
          )}

          {!loading && friendship?.status === 'BLOCKED' && friendship.isSender && (
            <button
              onClick={handleUnblock}
              disabled={actionLoading === 'unblock'}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ShieldBan className="h-4 w-4" />
              {actionLoading === 'unblock' ? 'Unblocking…' : 'Unblock'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
