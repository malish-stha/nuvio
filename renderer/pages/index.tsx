import React from 'react'
import Head from 'next/head'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { applyPrimaryThemeColor } from '../lib/theme'
import { useAuth, useUser, SignIn } from '@clerk/clerk-react'
import { useMockUser, isClerkConfigured } from '../lib/clerk-fallback'
import { pusherClient } from '../lib/pusher-client'
import { MessageSquare, Plus, Settings, LogOut, UserPlus, Trash2, PlusCircle, ChevronDown, Volume2, Edit3, Terminal, Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Hash, Users, Check, X } from 'lucide-react'

export default function HomePage() {
  const { getToken, userId: clerkUserId, signOut: clerkSignOut } = isClerkConfigured ? useAuth() : { getToken: async () => 'mock-token', userId: 'mock-user-12345', signOut: async () => {} }
  const { user: clerkUser } = isClerkConfigured ? useUser() : { user: null }
  const mockContext = isClerkConfigured ? null : useMockUser()

  const activeUserId = isClerkConfigured ? clerkUserId : mockContext?.user?.id
  const activeUserFullName = isClerkConfigured ? clerkUser?.fullName : mockContext?.user?.fullName
  const activeUserImage = isClerkConfigured ? clerkUser?.imageUrl : mockContext?.user?.imageUrl

  const handleSignOut = async () => {
    if (isClerkConfigured) {
      await clerkSignOut({ redirectUrl: '/' })
    } else if (mockContext) {
      mockContext.signOut()
    }
  }

  const [accentColor, setAccentColor] = React.useState('#5865F2') // Default Discord blurple hex
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [settingsTab, setSettingsTab] = React.useState<'profile' | 'theme'>('profile')

  // Channels, messages and text inputs states
  const [channels, setChannels] = React.useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = React.useState<string>('')
  const [activeChannelName, setActiveChannelName] = React.useState<string>('general')
  const [activeChannelType, setActiveChannelType] = React.useState<string>('TEXT')
  const [messages, setMessages] = React.useState<any[]>([])
  const [chatInput, setChatInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  // Voice Call States
  const [isMuted, setIsMuted] = React.useState(false)
  const [isDeafened, setIsDeafened] = React.useState(false)
  const [connectedVoiceChannel, setConnectedVoiceChannel] = React.useState<any>(null)

  // Channel CRUD States
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false)
  const [newChannelName, setNewChannelName] = React.useState('')
  const [newChannelType, setNewChannelType] = React.useState<'TEXT' | 'VOICE' | 'WHITEBOARD' | 'PLAYGROUND'>('TEXT')
  const [isDeleteChannelConfirmOpen, setIsDeleteChannelConfirmOpen] = React.useState(false)
  const [channelToDelete, setChannelToDelete] = React.useState<any>(null)
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = React.useState(false)

  // User Profile Form States
  const [dbUser, setDbUser] = React.useState<any>(null)
  const [profileName, setProfileName] = React.useState('')
  const [profileAvatar, setProfileAvatar] = React.useState('')
  const [profileBio, setProfileBio] = React.useState('')
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)

  // Servers and Direct Messages states
  const [servers, setServers] = React.useState<any[]>([])
  const [activeServerId, setActiveServerId] = React.useState<string>('dms') // 'dms' or server.id
  const [dmChannels, setDmChannels] = React.useState<any[]>([])
  const [activeDmChannelId, setActiveDmChannelId] = React.useState<string>('')
  const [dmMessages, setDmMessages] = React.useState<any[]>([])
  const [dmInput, setDmInput] = React.useState('')
  const [dmRecipient, setDmRecipient] = React.useState<any>(null)

  // Friendship & DM Restriction States
  const [friendsList, setFriendsList] = React.useState<any[]>([])
  const [pendingIncoming, setPendingIncoming] = React.useState<any[]>([])
  const [pendingOutgoing, setPendingOutgoing] = React.useState<any[]>([])
  const [friendsSearchQuery, setFriendsSearchQuery] = React.useState('')
  const [friendsSearchResults, setFriendsSearchResults] = React.useState<any[]>([])
  const [activeFriendsSubTab, setActiveFriendsSubTab] = React.useState<'ALL' | 'PENDING' | 'ADD_FRIEND'>('ALL')
  const [activeDmTab, setActiveDmTab] = React.useState<'friends' | 'chat'>('friends')

  // Dialog & Modal Toggles
  const [isCreateServerOpen, setIsCreateServerOpen] = React.useState(false)
  const [isServerSettingsOpen, setIsServerSettingsOpen] = React.useState(false)
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [isDmSearchOpen, setIsDmSearchOpen] = React.useState(false)

  // Form Inputs
  const [newServerName, setNewServerName] = React.useState('')
  const [joinInviteCode, setJoinInviteCode] = React.useState('')
  const [editServerName, setEditServerName] = React.useState('')
  const [editServerImage, setEditServerImage] = React.useState('')
  const [userSearchQuery, setUserSearchQuery] = React.useState('')
  const [userSearchResults, setUserSearchResults] = React.useState<any[]>([])

  const [isServerMenuOpen, setIsServerMenuOpen] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const dmMessagesEndRef = React.useRef<HTMLDivElement>(null)

  // Load theme preference on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedColor = localStorage.getItem('nuvio_accent_color')
      if (cachedColor) {
        setAccentColor(cachedColor)
        applyPrimaryThemeColor(cachedColor)
      }
    }
  }, [])

  // Auto-scroll chat history to the bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-scroll DM chat history
  React.useEffect(() => {
    dmMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dmMessages])

  // Fetch workspace server & channels configuration
  React.useEffect(() => {
    const initWorkspace = async () => {
      try {
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        const res = await fetch('/api/init-workspace', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()

        if (data.user) {
          setDbUser(data.user)
          setProfileName(data.user.fullName || '')
          setProfileAvatar(data.user.imageUrl || '')
          setProfileBio(data.user.bio || '')
        }

        if (data.servers && data.servers.length > 0) {
          setServers(data.servers)
          const firstServer = data.servers[0]
          setActiveServerId(firstServer.id)
          setChannels(firstServer.channels || [])
          if (firstServer.channels && firstServer.channels.length > 0) {
            const generalChan = firstServer.channels.find((c: any) => c.name === 'general')
            const initialChan = generalChan || firstServer.channels[0]
            setActiveChannelId(initialChan.id)
            setActiveChannelName(initialChan.name)
            setActiveChannelType(initialChan.type || 'TEXT')
          }
        } else {
          setActiveServerId('dms')
        }
      } catch (err) {
        console.error('Failed to initialize workspace:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeUserId) {
      initWorkspace()
    }
  }, [activeUserId])

  // Fetch DM channels on mount / activeUserId change
  const fetchDmChannels = async () => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/dms/channels', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setDmChannels(data)
      } else {
        console.error('Failed to fetch DM channels, response not an array:', data)
        setDmChannels([])
      }
    } catch (err) {
      console.error('Failed to fetch DM channels:', err)
      setDmChannels([])
    }
  }

  const fetchFriendsData = async () => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/friends/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setFriendsList(data.friends || [])
        setPendingIncoming(data.pendingIncoming || [])
        setPendingOutgoing(data.pendingOutgoing || [])
      }
    } catch (err) {
      console.error('Failed to fetch friends data:', err)
    }
  }

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId })
      })
      if (res.ok) {
        fetchFriendsData()
        if (friendsSearchQuery) {
          handleFriendsSearch(friendsSearchQuery)
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('Friend request failed:', errData.error || 'Failed to send friend request')
      }
    } catch (err) {
      console.error('Error sending friend request:', err)
    }
  }

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId })
      })
      if (res.ok) {
        fetchFriendsData()
        if (friendsSearchQuery) {
          handleFriendsSearch(friendsSearchQuery)
        }
      }
    } catch (err) {
      console.error('Error accepting friend request:', err)
    }
  }

  const handleDeclineFriendRequest = async (friendshipId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId })
      })
      if (res.ok) {
        fetchFriendsData()
        if (friendsSearchQuery) {
          handleFriendsSearch(friendsSearchQuery)
        }
      }
    } catch (err) {
      console.error('Error declining friend request:', err)
    }
  }

  const handleFriendsSearch = async (val: string) => {
    setFriendsSearchQuery(val)
    if (!val.trim()) {
      setFriendsSearchResults([])
      return
    }
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(val)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setFriendsSearchResults(data)
      }
    } catch (err) {
      console.error('Error searching users for friends:', err)
    }
  }

  React.useEffect(() => {
    if (activeUserId) {
      fetchDmChannels()
      fetchFriendsData()
    }
  }, [activeUserId])

  // Set DM Recipient details
  React.useEffect(() => {
    if (activeDmChannelId && dmChannels.length > 0) {
      const activeChan = dmChannels.find(c => c.id === activeDmChannelId)
      if (activeChan) {
        const recipient = activeChan.participants.find((p: any) => p.id !== activeUserId)
        setDmRecipient(recipient || null)
      } else {
        setDmRecipient(null)
      }
    } else {
      setDmRecipient(null)
    }
  }, [activeDmChannelId, dmChannels, activeUserId])

  // Fetch direct messages on active DM channel change
  const fetchDmMessages = async (dmChanId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/dms/messages?dmChannelId=${dmChanId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (data.items) {
        setDmMessages(data.items.reverse())
      }
    } catch (err) {
      console.error('Failed to fetch DM messages:', err)
    }
  }

  React.useEffect(() => {
    if (activeServerId === 'dms' && activeDmChannelId) {
      fetchDmMessages(activeDmChannelId)
    }
  }, [activeDmChannelId, activeServerId])

  // Fetch channel messages on active channel changes
  const fetchMessages = async (channelId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/messages?channelId=${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (data.items) {
        // Reverse array to render oldest first (chronological order)
        setMessages(data.items.reverse())
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  React.useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId)
    }
  }, [activeChannelId])

  // Track voice connection state
  React.useEffect(() => {
    if (activeChannelType === 'VOICE' && activeChannelId) {
      setConnectedVoiceChannel({ id: activeChannelId, name: activeChannelName, serverId: activeServerId })
    }
  }, [activeChannelId, activeChannelType, activeChannelName, activeServerId])

  // Pusher Client Subscription
  React.useEffect(() => {
    if (!pusherClient || !activeChannelId) {
      return
    }

    const channel = pusherClient.subscribe(`channel-${activeChannelId}`)

    channel.bind('new-message', (newMessage: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
    })

    return () => {
      pusherClient.unsubscribe(`channel-${activeChannelId}`)
    }
  }, [activeChannelId, pusherClient])

  // Pusher DM Subscription
  React.useEffect(() => {
    if (!pusherClient || !activeDmChannelId) {
      return
    }

    const channel = pusherClient.subscribe(`dm-${activeDmChannelId}`)

    channel.bind('new-dm', (newDm: any) => {
      setDmMessages((prev) => {
        if (prev.some((m) => m.id === newDm.id)) return prev
        return [...prev, newDm]
      })
    })

    return () => {
      pusherClient.unsubscribe(`dm-${activeDmChannelId}`)
    }
  }, [activeDmChannelId, pusherClient])

  // Pusher Friends Real-time Subscription — subscribe to personal user channel
  // Use a ref to avoid stale closure over friendsSearchQuery inside the event handler
  const friendsSearchQueryRef = React.useRef(friendsSearchQuery)
  React.useEffect(() => {
    friendsSearchQueryRef.current = friendsSearchQuery
  }, [friendsSearchQuery])

  React.useEffect(() => {
    if (!pusherClient || !activeUserId) {
      return
    }

    const channel = pusherClient.subscribe(`user-${activeUserId}`)

    channel.bind('friend-update', () => {
      fetchFriendsData()
      // Also refresh the Add Friend search results if a query is active
      if (friendsSearchQueryRef.current.trim()) {
        handleFriendsSearch(friendsSearchQueryRef.current)
      }
    })

    return () => {
      pusherClient.unsubscribe(`user-${activeUserId}`)
    }
  }, [activeUserId, pusherClient])

  // Send message submit handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const currentInput = chatInput
    setChatInput('')

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: currentInput,
          channelId: activeChannelId,
        })
      })

      if (!res.ok) {
        console.error('Failed to send message:', await res.text())
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleServerSelect = (serverId: string) => {
    setActiveServerId(serverId)
    if (serverId === 'dms') {
      setChannels([])
      setActiveChannelId('')
      setActiveChannelName('')
      setActiveChannelType('TEXT')
      setActiveDmChannelId('')
      setActiveDmTab('friends')
    } else {
      const server = servers.find(s => s.id === serverId)
      if (server) {
        setChannels(server.channels || [])
        if (server.channels && server.channels.length > 0) {
          const generalChan = server.channels.find((c: any) => c.name === 'general')
          const initialChan = generalChan || server.channels[0]
          setActiveChannelId(initialChan.id)
          setActiveChannelName(initialChan.name)
          setActiveChannelType(initialChan.type || 'TEXT')
        } else {
          setActiveChannelId('')
          setActiveChannelName('')
          setActiveChannelType('TEXT')
        }
      }
    }
  }

  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dmInput.trim() || !activeDmChannelId) return

    const currentInput = dmInput
    setDmInput('')

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/dms/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: currentInput,
          dmChannelId: activeDmChannelId,
        })
      })

      if (!res.ok) {
        console.error('Failed to send DM:', await res.text())
      } else {
        fetchDmChannels()
      }
    } catch (err) {
      console.error('Error sending DM:', err)
    }
  }

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServerName.trim()) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newServerName,
        })
      })

      if (res.ok) {
        const newServer = await res.json()
        setServers(prev => [...prev, newServer])
        handleServerSelect(newServer.id)
        setIsCreateServerOpen(false)
        setNewServerName('')
      }
    } catch (err) {
      console.error('Failed to create server:', err)
    }
  }

  const handleJoinServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinInviteCode.trim()) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/servers/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inviteCode: joinInviteCode,
        })
      })

      if (res.ok) {
        const joinedServer = await res.json()
        setServers(prev => {
          if (prev.some(s => s.id === joinedServer.id)) return prev
          return [...prev, joinedServer]
        })
        handleServerSelect(joinedServer.id)
        setIsCreateServerOpen(false)
        setJoinInviteCode('')
      } else {
        alert(await res.text() || 'Invalid invite code')
      }
    } catch (err) {
      console.error('Failed to join server:', err)
    }
  }

  const handleSaveServerSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editServerName.trim() || !activeServerId || activeServerId === 'dms') return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/servers/${activeServerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editServerName,
          imageUrl: editServerImage,
        })
      })

      if (res.ok) {
        const updatedServer = await res.json()
        setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s))
        setIsServerSettingsOpen(false)
      }
    } catch (err) {
      console.error('Failed to save server settings:', err)
    }
  }

  const handleDeleteServer = async () => {
    if (!activeServerId || activeServerId === 'dms') return
    if (!confirm('Are you sure you want to delete this server? This action is irreversible.')) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/servers/${activeServerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        const updatedServers = servers.filter(s => s.id !== activeServerId)
        setServers(updatedServers)
        setIsServerSettingsOpen(false)
        if (updatedServers.length > 0) {
          handleServerSelect(updatedServers[0].id)
        } else {
          handleServerSelect('dms')
        }
      }
    } catch (err) {
      console.error('Failed to delete server:', err)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newChannelName.trim(),
          type: newChannelType,
          serverId: activeServerId
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create channel')
      }

      const createdChan = await res.json()
      setChannels(prev => [...prev, createdChan])
      setServers(prev => prev.map(s => {
        if (s.id === activeServerId) {
          return {
            ...s,
            channels: [...(s.channels || []), createdChan]
          }
        }
        return s
      }))

      if (createdChan.type !== 'VOICE') {
        setActiveChannelId(createdChan.id)
        setActiveChannelName(createdChan.name)
        setActiveChannelType(createdChan.type)
      }

      setNewChannelName('')
      setIsCreateChannelOpen(false)
      setIsTypeDropdownOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error creating channel')
    }
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/channels/${channelToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to delete channel')
      }

      const updatedChannels = channels.filter(c => c.id !== channelToDelete.id)
      setChannels(updatedChannels)
      setServers(prev => prev.map(s => {
        if (s.id === activeServerId) {
          return {
            ...s,
            channels: s.channels.filter((c: any) => c.id !== channelToDelete.id)
          }
        }
        return s
      }))

      if (activeChannelId === channelToDelete.id) {
        const generalChan = updatedChannels.find(c => c.name === 'general')
        const fallbackChan = generalChan || updatedChannels[0]
        if (fallbackChan) {
          setActiveChannelId(fallbackChan.id)
          setActiveChannelName(fallbackChan.name)
          setActiveChannelType(fallbackChan.type || 'TEXT')
        } else {
          setActiveChannelId('')
          setActiveChannelName('')
          setActiveChannelType('TEXT')
        }
      }

      if (connectedVoiceChannel && connectedVoiceChannel.id === channelToDelete.id) {
        setConnectedVoiceChannel(null)
      }

      setIsDeleteChannelConfirmOpen(false)
      setChannelToDelete(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error deleting channel')
    }
  }

  const handleUserSearch = async (val: string) => {
    setUserSearchQuery(val)
    if (!val.trim()) {
      setUserSearchResults([])
      return
    }

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      setUserSearchResults(data)
    } catch (err) {
      console.error('Failed to search users:', err)
    }
  }

  const handleStartDm = async (recipientId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/dms/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId })
      })

      if (res.ok) {
        const channel = await res.json()
        setDmChannels(prev => {
          if (prev.some(c => c.id === channel.id)) return prev
          return [channel, ...prev]
        })
        setActiveServerId('dms')
        setActiveDmChannelId(channel.id)
        setActiveDmTab('chat')
        setIsDmSearchOpen(false)
        setUserSearchQuery('')
        setUserSearchResults([])
      }
    } catch (err) {
      console.error('Failed to start DM:', err)
    }
  }

  // Update profile details handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName.trim()) return

    setIsSavingProfile(true)
    try {
      // 1. If Clerk is configured and user is loaded, update Clerk user profile first
      if (isClerkConfigured && clerkUser) {
        const parts = profileName.trim().split(/\s+/)
        const firstName = parts[0] || ''
        const lastName = parts.slice(1).join(' ') || ''
        await clerkUser.update({
          firstName,
          lastName,
        })
      }

      // 2. Update local PostgreSQL database (includes custom bio field)
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileName,
          imageUrl: profileAvatar,
          bio: profileBio,
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setDbUser(updated)
        // Immediately reload messages to reflect name changes in chat logs
        if (activeChannelId) {
          fetchMessages(activeChannelId)
        }
        setIsSettingsOpen(false)
      } else {
        console.error('Failed to update profile in database:', await res.text())
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleColorChange = (hex: string) => {
    setAccentColor(hex)
    applyPrimaryThemeColor(hex)
  }

  const presets = [
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
    { name: 'Steel Ocean', hex: '#0EA5E9' },
  ]

  const VoiceRoomView = () => {
    const voiceUsers = [
      { id: 'user-1', name: dbUser?.fullName || activeUserFullName || 'You', avatar: dbUser?.imageUrl || activeUserImage, isTalking: !isMuted && !isDeafened, isLocal: true }
    ]

    return (
      <div className="h-full flex flex-col bg-muted/20 items-center justify-center p-8 select-none">
        <div className="w-full max-w-3xl flex-1 flex flex-col justify-between">
          <div className="text-center mb-6">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/20 inline-flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Connected to Voice Lounge
            </span>
            <p className="text-xs text-muted-foreground mt-2">Active participants in the channel</p>
          </div>

          <div className="flex justify-center items-center my-auto w-full">
            {voiceUsers.map(usr => (
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
                  {usr.isLocal && isDeafened && (
                    <span className="absolute bottom-0 left-0 bg-rose-500 text-white rounded-full p-1 border border-card">
                      <HeadphoneOff className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm truncate max-w-full text-foreground">{usr.name}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {usr.isLocal 
                    ? (usr.isTalking 
                        ? 'Speaking...' 
                        : isDeafened 
                          ? 'Deafened' 
                          : isMuted 
                            ? 'Muted' 
                            : 'Connected')
                    : (usr.isTalking ? 'Speaking...' : 'Muted')}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center gap-4 shadow-xl shrink-0 mt-8">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-xl transition cursor-pointer ${
                isMuted ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-3 rounded-xl transition cursor-pointer ${
                isDeafened ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {isDeafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                setConnectedVoiceChannel(null)
                const generalChan = channels.find(c => c.name === 'general')
                const fallbackChan = generalChan || channels.find(c => c.type === 'TEXT') || channels[0]
                if (fallbackChan) {
                  setActiveChannelId(fallbackChan.id)
                  setActiveChannelName(fallbackChan.name)
                  setActiveChannelType(fallbackChan.type || 'TEXT')
                }
              }}
              className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer hover:rotate-90 duration-300"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const WhiteboardView = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = React.useState(false)
    const [color, setColor] = React.useState('#5865F2')
    const [lineWidth, setLineWidth] = React.useState(4)
    const contextRef = React.useRef<CanvasRenderingContext2D | null>(null)

    React.useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const updateSize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect()
        canvas.width = (rect?.width || 800) * 2
        canvas.height = (rect?.height || 500) * 2
        canvas.style.width = `${rect?.width || 800}px`
        canvas.style.height = `${rect?.height || 500}px`
        
        const context = canvas.getContext('2d')
        if (!context) return
        context.scale(2, 2)
        context.lineCap = 'round'
        context.strokeStyle = color
        context.lineWidth = lineWidth
        contextRef.current = context
        
        context.fillStyle = '#0f172a'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      const timer = setTimeout(updateSize, 100)
      window.addEventListener('resize', updateSize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateSize)
      }
    }, [])

    React.useEffect(() => {
      if (contextRef.current) {
        contextRef.current.strokeStyle = color
        contextRef.current.lineWidth = lineWidth
      }
    }, [color, lineWidth])

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
      const { offsetX, offsetY } = nativeEvent
      contextRef.current?.beginPath()
      contextRef.current?.moveTo(offsetX, offsetY)
      setIsDrawing(true)
    }

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      const { offsetX, offsetY } = nativeEvent
      contextRef.current?.lineTo(offsetX, offsetY)
      contextRef.current?.stroke()
    }

    const stopDrawing = () => {
      contextRef.current?.closePath()
      setIsDrawing(false)
    }

    const clearCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas || !contextRef.current) return
      contextRef.current.fillStyle = '#0f172a'
      contextRef.current.fillRect(0, 0, canvas.width, canvas.height)
    }

    const colors = ['#5865F2', '#E11D48', '#9333EA', '#2563EB', '#16A34A', '#D97706', '#FFFFFF']

    return (
      <div className="h-full flex flex-col bg-[#0f172a] relative overflow-hidden select-none">
        <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Colors</span>
            <div className="flex items-center gap-1.5">
              {colors.map(col => (
                <button
                  key={col}
                  onClick={() => setColor(col)}
                  className={`h-6 w-6 rounded-full border-2 transition cursor-pointer ${
                    color === col ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thickness</span>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-24 accent-primary"
              />
              <span className="text-xs font-mono text-foreground w-4">{lineWidth}px</span>
            </div>
            
            <button
              onClick={clearCanvas}
              className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-[#0f172a]">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="block cursor-crosshair h-full w-full"
          />
        </div>
      </div>
    )
  }

  const PlaygroundView = () => {
    const [code, setCode] = React.useState(`// Nuvio Collaborative Code Playground
// Write your JavaScript/HTML code here and click Run!

function calculateSplit(total, people) {
  const split = total / people;
  console.log("Each person owes: $" + split.toFixed(2));
  return split;
}

calculateSplit(150.50, 4);`)
    const [consoleLogs, setConsoleLogs] = React.useState<string[]>([
      'Nuvio Compiler loaded successfully.',
      'Ready to run code snippets.'
    ])
    const [isRunning, setIsRunning] = React.useState(false)
    const [language, setLanguage] = React.useState('javascript')

    const runCode = () => {
      setIsRunning(true)
      setConsoleLogs(prev => [...prev, '> Running compiler...'])
      
      setTimeout(() => {
        try {
          if (language === 'javascript') {
            const logs: string[] = []
            const customConsole = {
              log: (...args: any[]) => {
                logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '))
              },
              error: (...args: any[]) => {
                logs.push(`[ERROR] ${args.join(' ')}`)
              }
            }

            const runBlock = new Function('console', code)
            runBlock(customConsole)

            setConsoleLogs(prev => [
              ...prev,
              ...logs.map(log => `[LOG] ${log}`),
              `Process completed successfully with exit code 0.`
            ])
          } else {
            setConsoleLogs(prev => [
              ...prev,
              `HTML / Style preview compiled successfully.`,
              `Rendered in viewport mock context.`
            ])
          }
        } catch (err: any) {
          setConsoleLogs(prev => [...prev, `[ERROR] Compile failed: ${err.message}`])
        } finally {
          setIsRunning(false)
        }
      }, 800)
    }

    const loadTemplate = (lang: string) => {
      setLanguage(lang)
      if (lang === 'javascript') {
        setCode(`// Nuvio Collaborative Code Playground
// Write your JavaScript/HTML code here and click Run!

function calculateSplit(total, people) {
  const split = total / people;
  console.log("Each person owes: $" + split.toFixed(2));
  return split;
}

calculateSplit(150.50, 4);`)
      } else {
        setCode(`<!-- Nuvio UI Component Preview -->
<div class="card p-5 bg-slate-800 rounded-xl border border-slate-700 text-white shadow-xl">
  <h2 class="text-xl font-bold mb-2">Welcome to Nuvio Dashboard</h2>
  <p class="text-sm text-slate-400">Collaboration built directly for developers.</p>
  <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mt-4 text-xs font-bold transition">Click me</button>
</div>`)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = code.substring(0, start) + '  ' + code.substring(end)
        setCode(newValue)
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    }

    return (
      <div className="h-full flex flex-col bg-muted/10 select-none overflow-hidden">
        <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Language</span>
            <select
              value={language}
              onChange={(e) => loadTemplate(e.target.value)}
              className="bg-card border border-border text-foreground text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="javascript">JavaScript (ES6)</option>
              <option value="html">HTML / CSS component</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setConsoleLogs(['Terminal console logs cleared.'])}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Clear Logs
            </button>
            <button
              onClick={runCode}
              disabled={isRunning}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-border flex flex-col h-full bg-[#1e1e2e]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-slate-100 font-mono text-xs p-6 outline-none resize-none leading-relaxed overflow-y-auto"
              style={{ tabSize: 2 }}
            />
          </div>

          <div className="w-96 flex flex-col bg-[#11111b] h-full">
            <div className="h-9 border-b border-[#181825] px-4 flex items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Console Logs</span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="font-mono text-xs text-slate-300 space-y-2 select-text">
                {consoleLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed break-all ${
                      log.startsWith('[ERROR]')
                        ? 'text-rose-400'
                        : log.startsWith('[LOG]')
                        ? 'text-emerald-400'
                        : log.startsWith('>')
                        ? 'text-sky-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    )
  }

  if (isClerkConfigured && !clerkUserId) {
    return (
      <div className="flex h-screen w-screen bg-[#070a12] items-center justify-center">
        <SignIn 
          routing="hash" 
          forceRedirectUrl="/" 
          signUpForceRedirectUrl="/"
          fallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      </div>
    )
  }

  return (
    <React.Fragment>
      <Head>
        <title>Nuvio - Discord Clone Dashboard</title>
      </Head>

      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/30">

        {/* Servers Sidebar */}
        <aside className="w-[72px] bg-muted flex flex-col items-center py-4 space-y-4 border-r border-border shrink-0 select-none">
          {/* Home/DMs Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <div
                  onClick={() => handleServerSelect('dms')}
                  className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                    activeServerId === 'dms'
                      ? 'rounded-xl bg-primary text-primary-foreground shadow-primary/20'
                      : 'rounded-3xl bg-card hover:bg-primary hover:text-primary-foreground hover:rounded-xl border border-border text-foreground/80'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                </div>
              }
            />
            <TooltipContent side="right">Direct Messages</TooltipContent>
          </Tooltip>

          <div className="w-8 h-[2px] bg-border rounded" />

          {/* Servers List */}
          <div className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto no-scrollbar">
            {servers.map((srv) => (
              <Tooltip key={srv.id}>
                <TooltipTrigger
                  render={
                    <div
                      onClick={() => handleServerSelect(srv.id)}
                      className={`w-12 h-12 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 relative select-none uppercase ${
                        activeServerId === srv.id
                          ? 'rounded-xl bg-primary text-primary-foreground'
                          : 'rounded-3xl bg-card hover:bg-primary hover:text-primary-foreground hover:rounded-xl border border-border text-foreground/80'
                      }`}
                    >
                      {activeServerId === srv.id && (
                        <div className="absolute left-0 w-1 h-8 bg-primary-foreground rounded-r-md -translate-x-[12px]" />
                      )}
                      
                      {srv.imageUrl ? (
                        <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover rounded-[inherit]" />
                      ) : (
                        srv.name.split(' ').map((w: string) => w[0]).join('').substring(0, 3)
                      )}
                    </div>
                  }
                />
                <TooltipContent side="right">{srv.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="w-8 h-[2px] bg-border rounded" />

          {/* Add/Join Server Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <div
                  onClick={() => setIsCreateServerOpen(true)}
                  className="w-12 h-12 rounded-3xl bg-card hover:bg-primary/20 flex items-center justify-center text-primary cursor-pointer hover:text-foreground hover:rounded-xl transition-all duration-300 border border-border"
                >
                  <Plus className="h-5 w-5" />
                </div>
              }
            />
            <TooltipContent side="right">Add / Join Server</TooltipContent>
          </Tooltip>
        </aside>

        {/* Workspace Channels Sidebar */}
        <aside className="w-60 bg-card/60 flex flex-col border-r border-border shrink-0">
          {activeServerId === 'dms' ? (
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
                <span className="truncate">{servers.find(s => s.id === activeServerId)?.name || 'Server'}</span>
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
                  {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
                    <>
                      <button
                        onClick={() => {
                          const srv = servers.find(s => s.id === activeServerId)
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
                    setActiveDmTab('friends')
                  }}
                  className={`px-3 py-2 rounded-xl cursor-pointer flex items-center transition select-none mb-3 ${
                    activeDmTab === 'friends'
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
                    return (
                      <div
                        key={chan.id}
                        onClick={() => {
                          setActiveDmChannelId(chan.id)
                          setActiveDmTab('chat')
                        }}
                        className={`px-3 py-2 rounded-xl cursor-pointer flex items-center transition select-none ${
                          activeDmChannelId === chan.id && activeDmTab === 'chat'
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={recipient.imageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {recipient.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold truncate leading-none mb-0.5">{recipient.fullName}</p>
                          <p className="text-[9px] text-muted-foreground/75 truncate leading-none">
                            {recipient.bio || 'Hello there!'}
                          </p>
                        </div>
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
                    {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewChannelType('TEXT')
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
                    {channels.filter(c => c.type === 'TEXT').map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChannelId(ch.id)
                          setActiveChannelName(ch.name)
                          setActiveChannelType('TEXT')
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
                        {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && ch.name !== 'general' && (
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
                    {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewChannelType('VOICE')
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
                    {channels.filter(c => c.type === 'VOICE').map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChannelId(ch.id)
                          setActiveChannelName(ch.name)
                          setActiveChannelType('VOICE')
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
                        {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
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
                    {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewChannelType('WHITEBOARD')
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
                    {channels.filter(c => c.type === 'WHITEBOARD' || c.type === 'PLAYGROUND').map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChannelId(ch.id)
                          setActiveChannelName(ch.name)
                          setActiveChannelType(ch.type || 'TEXT')
                        }}
                        className={`group px-3 py-2 rounded-md font-medium text-sm cursor-pointer flex items-center justify-between transition ${
                          activeChannelId === ch.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center truncate mr-2">
                          {ch.type === 'WHITEBOARD' ? (
                            <Edit3 className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                          ) : (
                            <Terminal className="h-4 w-4 mr-2 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="truncate">{ch.name}</span>
                        </div>
                        {servers.find(s => s.id === activeServerId)?.ownerId === activeUserId && (
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
                      const server = servers.find(s => s.id === connectedVoiceChannel.serverId)
                      if (server) {
                        setChannels(server.channels || [])
                      }
                    }
                    setActiveChannelId(connectedVoiceChannel.id)
                    setActiveChannelName(connectedVoiceChannel.name)
                    setActiveChannelType('VOICE')
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
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsDeafened(!isDeafened)}
                    className={`p-1 rounded-md transition cursor-pointer active:scale-95 flex items-center justify-center ${
                      isDeafened ? 'text-rose-500 hover:bg-rose-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                    }`}
                    title={isDeafened ? "Undeafen" : "Deafen"}
                  >
                    {isDeafened ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setConnectedVoiceChannel(null)
                      if (activeChannelType === 'VOICE') {
                        const generalChan = channels.find(c => c.name === 'general')
                        const fallbackChan = generalChan || channels.find(c => c.type === 'TEXT') || channels[0]
                        if (fallbackChan) {
                          setActiveChannelId(fallbackChan.id)
                          setActiveChannelName(fallbackChan.name)
                          setActiveChannelType(fallbackChan.type || 'TEXT')
                        }
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

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background">
          <header className="h-12 border-b border-border flex items-center px-6 font-semibold shadow-sm justify-between shrink-0">
            <div className="flex items-center space-x-2 select-none">
              {activeServerId === 'dms' ? (
                activeDmTab === 'friends' ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 mr-2 text-foreground select-none">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-extrabold text-sm">Friends</span>
                    </div>
                    <div className="h-4 w-[1px] bg-border" />
                    <button
                      onClick={() => setActiveFriendsSubTab('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        activeFriendsSubTab === 'ALL'
                          ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFriendsSubTab('PENDING')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                        activeFriendsSubTab === 'PENDING'
                          ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                      }`}
                    >
                      <span>Pending</span>
                      {(pendingIncoming.length + pendingOutgoing.length) > 0 && (
                        <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                          {pendingIncoming.length + pendingOutgoing.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setActiveFriendsSubTab('ADD_FRIEND')
                        setFriendsSearchQuery('')
                        setFriendsSearchResults([])
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                        activeFriendsSubTab === 'ADD_FRIEND'
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 font-bold'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold'
                      }`}
                    >
                      Add Friend
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-muted-foreground font-semibold text-lg">@</span>
                    <span>{dmRecipient ? dmRecipient.fullName : 'Direct Messages'}</span>
                    {dmRecipient?.bio && (
                      <span className="text-xs text-muted-foreground font-normal ml-2 truncate max-w-[240px]">
                        — {dmRecipient.bio}
                      </span>
                    )}
                  </>
                )
              ) : (
                <>
                  {activeChannelType === 'VOICE' ? (
                    <Volume2 className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                  ) : activeChannelType === 'WHITEBOARD' ? (
                    <Edit3 className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                  ) : activeChannelType === 'PLAYGROUND' ? (
                    <Terminal className="h-5 w-5 text-muted-foreground mr-1 shrink-0" />
                  ) : (
                    <span className="text-muted-foreground font-semibold text-lg shrink-0">#</span>
                  )}
                  <span>{activeChannelName}</span>
                </>
              )}
            </div>
          </header>

          {/* Messages Log */}
          <div className="flex-1 relative overflow-hidden">
            {activeServerId === 'dms' && activeDmTab === 'friends' ? (
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
            ) : activeServerId === 'dms' ? (
              <ScrollArea className="h-full w-full px-6 py-4">
                {!activeDmChannelId ? (
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
                ) : dmMessages.length === 0 ? (
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dmMessages.map((msg) => (
                      <Tooltip key={msg.id}>
                        <TooltipTrigger render={
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
                        } />
                        {msg.sender?.bio && (
                          <TooltipContent side="right" className="max-w-[200px] break-words">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">User Bio</p>
                            <p className="text-xs">{msg.sender.bio}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                    <div ref={dmMessagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            ) : activeChannelType === 'VOICE' ? (
              <VoiceRoomView />
            ) : activeChannelType === 'WHITEBOARD' ? (
              <WhiteboardView />
            ) : activeChannelType === 'PLAYGROUND' ? (
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
                        <TooltipTrigger render={
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
                        } />
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
          {((activeServerId === 'dms' && activeDmTab === 'chat') || (activeServerId !== 'dms' && activeChannelType === 'TEXT')) && (
            <div className="px-6 pb-6 pt-2 shrink-0">
              {activeServerId === 'dms' ? (
                <form onSubmit={handleSendDm} className="relative flex items-center bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
                  <input
                    type="text"
                    value={dmInput}
                    onChange={(e) => setDmInput(e.target.value)}
                    placeholder={dmRecipient ? `Message @${dmRecipient.fullName}` : "Message..."}
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
                <form onSubmit={handleSendMessage} className="relative flex items-center bg-card border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
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
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">User Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Manage your personal user profile credentials and customise the design/styling theme details.
            </DialogDescription>
          </DialogHeader>

          {/* Setting Tabs */}
          <div className="flex border-b border-border mb-4 select-none">
            <button
              onClick={() => setSettingsTab('profile')}
              className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 cursor-pointer transition ${settingsTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setSettingsTab('theme')}
              className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 cursor-pointer transition ${settingsTab === 'theme'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              App Theme
            </button>
          </div>

          {settingsTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Avatar URL</label>
                <input
                  type="text"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Bio</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary min-h-[80px] resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          ) : (
            <div className="space-y-5 py-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Custom Accent Color</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Pick a custom color code for the UI theme</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-semibold text-muted-foreground select-all">{accentColor.toUpperCase()}</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-9 w-9 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Predefined Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => handleColorChange(preset.hex)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-left border cursor-pointer transition ${accentColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <span
                        style={{ backgroundColor: preset.hex }}
                        className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Join Server Modal */}
      <Dialog open={isCreateServerOpen} onOpenChange={setIsCreateServerOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Add a Server</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Create a brand new private server or join an existing server using an invite code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex border-b border-border mb-2 select-none">
              <button
                onClick={() => setJoinInviteCode('')}
                className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 cursor-pointer transition ${!joinInviteCode
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                Create Server
              </button>
              <button
                onClick={() => setJoinInviteCode(' ')}
                className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 cursor-pointer transition ${joinInviteCode
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                Join Server
              </button>
            </div>

            {!joinInviteCode.trim() ? (
              <form onSubmit={handleCreateServer} className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Server Name</label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="My Awesome Server"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition active:scale-[0.98] cursor-pointer"
                >
                  Create Server
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinServer} className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Invite Code</label>
                  <input
                    type="text"
                    value={joinInviteCode === ' ' ? '' : joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    placeholder="e.g. AB12CD"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary uppercase"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition active:scale-[0.98] cursor-pointer"
                >
                  Join Server
                </button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Settings Modal */}
      <Dialog open={isServerSettingsOpen} onOpenChange={setIsServerSettingsOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Server Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Update your server details or permanently delete this server.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveServerSettings} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Server Name</label>
              <input
                type="text"
                value={editServerName}
                onChange={(e) => setEditServerName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Server Icon URL</label>
              <input
                type="text"
                value={editServerImage}
                onChange={(e) => setEditServerImage(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/10"
            >
              Save Server Settings
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Server Invite Link Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Invite Friends</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Share this invite code or link with others to invite them to this server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Invite Code</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={servers.find(s => s.id === activeServerId)?.inviteCode || ''}
                  className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none font-mono font-bold text-center select-all select-none"
                />
                <button
                  onClick={() => {
                    const code = servers.find(s => s.id === activeServerId)?.inviteCode || ''
                    navigator.clipboard.writeText(code)
                    alert('Invite code copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition hover:bg-primary/90 cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Invite Link</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${servers.find(s => s.id === activeServerId)?.inviteCode || ''}` : ''}
                  className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-muted-foreground outline-none font-mono truncate select-all select-none"
                />
                <button
                  onClick={() => {
                    const code = servers.find(s => s.id === activeServerId)?.inviteCode || ''
                    navigator.clipboard.writeText(`${window.location.origin}/join?code=${code}`)
                    alert('Invite link copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition hover:bg-primary/90 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Messages User Search Modal */}
      <Dialog open={isDmSearchOpen} onOpenChange={setIsDmSearchOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">New Direct Message</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Search your friends by name or email to start a private conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Search User</label>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full h-10 bg-[#1e1f22] border border-border rounded-xl px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {!userSearchQuery ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground select-none">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2 stroke-[1.5]" />
                  Search your friends to start a private direct message conversation.
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground select-none">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p>No friends found matching that query.</p>
                  <p className="text-[10px] mt-1 text-muted-foreground/60">Only accepted friends appear here. Use the Friends tab to add new friends.</p>
                </div>
              ) : (
                userSearchResults.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => handleStartDm(usr.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:border-primary/40 bg-background/50 hover:bg-primary/5 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usr.imageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {usr.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate leading-none mb-0.5">{usr.fullName}</p>
                        <p className="text-[9px] text-muted-foreground truncate leading-none">{usr.bio || 'Available'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1.5 rounded-md font-bold cursor-pointer hover:bg-primary hover:text-white transition">
                      Message
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsDmSearchOpen(false)}
              className="w-full sm:w-auto h-10 px-5 bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Channel Modal */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Create Channel</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Add a new channel to coordinate text chat, voice lounge, whiteboard sketches, or playground code execution.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateChannel} className="space-y-5 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Channel Name</label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g. general-lounge"
                className="w-full h-10 bg-[#1e1f22] border border-border rounded-xl px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Channel Type</label>
              
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full h-10 bg-[#1e1f22] border border-border rounded-xl px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer font-semibold flex items-center justify-between transition-all select-none"
              >
                <div className="flex items-center gap-2">
                  {newChannelType === 'TEXT' ? (
                    <>
                      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Text Channel</span>
                    </>
                  ) : newChannelType === 'VOICE' ? (
                    <>
                      <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Voice Channel</span>
                    </>
                  ) : newChannelType === 'WHITEBOARD' ? (
                    <>
                      <Edit3 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Drawing Whiteboard</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Code Playground</span>
                    </>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute top-17 left-0 right-0 bg-[#1e1f22] border border-border rounded-xl shadow-xl z-50 overflow-hidden p-1 select-none">
                  {[
                    { type: 'TEXT', label: 'Text Channel', description: 'Post messages, images, and links', icon: Hash },
                    { type: 'VOICE', label: 'Voice Channel', description: 'Hang out in real-time with voice and audio lounge', icon: Volume2 },
                    { type: 'WHITEBOARD', label: 'Drawing Whiteboard', description: 'Collaborative sketch space and visual design board', icon: Edit3 },
                    { type: 'PLAYGROUND', label: 'Code Playground', description: 'Execute JS code snippets in an interactive sandbox', icon: Terminal }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setNewChannelType(opt.type as any)
                          setIsTypeDropdownOpen(false)
                        }}
                        className={`w-full px-3.5 py-2 text-left rounded-lg transition cursor-pointer flex items-start gap-3 hover:bg-muted/40 ${
                          newChannelType === opt.type ? 'bg-primary/15 text-primary' : 'text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-bold leading-none mb-1">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal">{opt.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsCreateChannelOpen(false)
                  setIsTypeDropdownOpen(false)
                }}
                className="w-full sm:w-auto h-10 px-5 bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newChannelName.trim()}
                className="w-full sm:w-auto h-10 px-5 bg-primary text-white hover:bg-primary/95 text-sm font-semibold rounded-xl transition disabled:opacity-40 cursor-pointer flex items-center justify-center"
              >
                Create
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Channel Confirmation Modal */}
      <Dialog open={isDeleteChannelConfirmOpen} onOpenChange={setIsDeleteChannelConfirmOpen}>
        <DialogContent className="max-w-sm bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-rose-500">Delete Channel</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Are you sure you want to delete <span className="font-bold text-foreground">#{channelToDelete?.name}</span>? This action cannot be undone and all channel messages will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsDeleteChannelConfirmOpen(false)}
              className="w-full sm:w-auto h-10 px-5 bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteChannel}
              className="w-full sm:w-auto h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer flex items-center justify-center animate-pulse"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}
