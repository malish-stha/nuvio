import React from 'react'
import Head from 'next/head'
import { applyPrimaryThemeColor } from '../lib/theme'
import { useAuth, useUser, SignIn } from '@clerk/clerk-react'
import { useMockUser, isClerkConfigured } from '../lib/clerk-fallback'
import { pusherClient } from '../lib/pusher-client'
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_SERVER_ID,
  DM_TABS,
  DmTab,
  CHANNEL_TYPES,
  ChannelType,
  FRIENDS_SUB_TABS,
  FriendsSubTab
} from '../lib/constants'

import { NavigationSidebar } from '../components/NavigationSidebar'
import { ChannelSidebar } from '../components/ChannelSidebar'
import { ChatArea } from '../components/ChatArea'
import { Modals } from '../components/Modals'
import { useVoiceCall } from '../hooks/useVoiceCall'

export default function HomePage() {
  const { getToken, userId: clerkUserId, signOut: clerkSignOut } = isClerkConfigured ? useAuth() : { getToken: async () => 'mock-token', userId: 'mock-user-12345', signOut: async () => { } }
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

  const [accentColor, setAccentColor] = React.useState(DEFAULT_ACCENT_COLOR)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [settingsTab, setSettingsTab] = React.useState<'profile' | 'theme'>('profile')

  // Channels, messages and text inputs states
  const [channels, setChannels] = React.useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = React.useState<string>('')
  const [activeChannelName, setActiveChannelName] = React.useState<string>('general')
  const [activeChannelType, setActiveChannelType] = React.useState<string>(CHANNEL_TYPES.TEXT)
  const [messages, setMessages] = React.useState<any[]>([])
  const [chatInput, setChatInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  // Channel CRUD States
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false)
  const [newChannelName, setNewChannelName] = React.useState('')
  const [newChannelType, setNewChannelType] = React.useState<ChannelType>(CHANNEL_TYPES.TEXT)
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
  const [activeServerId, setActiveServerId] = React.useState<string>(DEFAULT_SERVER_ID) // 'dms' or server.id
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
  const [activeFriendsSubTab, setActiveFriendsSubTab] = React.useState<FriendsSubTab>(FRIENDS_SUB_TABS.ALL)
  const [activeDmTab, setActiveDmTab] = React.useState<DmTab>(DM_TABS.FRIENDS)

  // Dialog & Modal Toggles
  const [isCreateServerOpen, setIsCreateServerOpen] = React.useState(false)
  const [isServerSettingsOpen, setIsServerSettingsOpen] = React.useState(false)
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [isDmSearchOpen, setIsDmSearchOpen] = React.useState(false)
  const [voiceChannelToJoin, setVoiceChannelToJoin] = React.useState<any>(null)

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

  // Voice Calling Hook Integration
  const {
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    connectedVoiceChannel,
    setConnectedVoiceChannel,
    voiceParticipants,
    isScreenSharing,
    screenSources,
    isScreenPickerOpen,
    setIsScreenPickerOpen,
    startScreenShare,
    stopScreenShare,
    selectScreenSource
  } = useVoiceCall({
    activeUserId,
    activeUserFullName,
    activeUserImage,
    dbUser,
    activeChannelId,
    activeChannelName,
    activeChannelType,
    activeServerId
  })

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
            setActiveChannelType(initialChan.type || CHANNEL_TYPES.TEXT)
          }
        } else {
          setActiveServerId(DEFAULT_SERVER_ID)
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
    if (serverId === DEFAULT_SERVER_ID) {
      setChannels([])
      setActiveChannelId('')
      setActiveChannelName('')
      setActiveChannelType(CHANNEL_TYPES.TEXT)
      setActiveDmChannelId('')
      setActiveDmTab(DM_TABS.FRIENDS)
    } else {
      const server = servers.find(s => s.id === serverId)
      if (server) {
        setChannels(server.channels || [])
        if (server.channels && server.channels.length > 0) {
          const generalChan = server.channels.find((c: any) => c.name === 'general')
          const initialChan = generalChan || server.channels[0]
          setActiveChannelId(initialChan.id)
          setActiveChannelName(initialChan.name)
          setActiveChannelType(initialChan.type || CHANNEL_TYPES.TEXT)
        } else {
          setActiveChannelId('')
          setActiveChannelName('')
          setActiveChannelType(CHANNEL_TYPES.TEXT)
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
    if (!editServerName.trim() || !activeServerId || activeServerId === DEFAULT_SERVER_ID) return

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
    if (!activeServerId || activeServerId === DEFAULT_SERVER_ID) return
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
          handleServerSelect(DEFAULT_SERVER_ID)
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

      if (createdChan.type !== CHANNEL_TYPES.VOICE) {
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
          setActiveChannelType(fallbackChan.type || CHANNEL_TYPES.TEXT)
        } else {
          setActiveChannelId('')
          setActiveChannelName('')
          setActiveChannelType(CHANNEL_TYPES.TEXT)
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
        setActiveServerId(DEFAULT_SERVER_ID)
        setActiveDmChannelId(channel.id)
        setActiveDmTab(DM_TABS.CHAT)
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
  } return (
    <React.Fragment>
      <Head>
        <title>Nuvio - Discord Clone Dashboard</title>
      </Head>

      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/30">

        {/* Servers Sidebar */}
        <NavigationSidebar
          servers={servers}
          activeServerId={activeServerId}
          handleServerSelect={handleServerSelect}
          setIsCreateServerOpen={setIsCreateServerOpen}
        />

        {/* Workspace Channels Sidebar */}
        <ChannelSidebar
          activeServerId={activeServerId}
          setActiveServerId={setActiveServerId}
          setIsDmSearchOpen={setIsDmSearchOpen}
          isServerMenuOpen={isServerMenuOpen}
          setIsServerMenuOpen={setIsServerMenuOpen}
          servers={servers}
          setIsInviteOpen={setIsInviteOpen}
          activeUserId={activeUserId}
          setEditServerName={setEditServerName}
          setEditServerImage={setEditServerImage}
          setIsServerSettingsOpen={setIsServerSettingsOpen}
          handleDeleteServer={handleDeleteServer}
          setActiveDmChannelId={setActiveDmChannelId}
          setActiveDmTab={setActiveDmTab}
          activeDmTab={activeDmTab}
          pendingIncoming={pendingIncoming}
          dmChannels={dmChannels}
          activeDmChannelId={activeDmChannelId}
          dbUser={dbUser}
          activeUserImage={activeUserImage}
          activeUserFullName={activeUserFullName}
          setProfileName={setProfileName}
          setProfileAvatar={setProfileAvatar}
          setProfileBio={setProfileBio}
          setSettingsTab={setSettingsTab}
          setIsSettingsOpen={setIsSettingsOpen}
          handleSignOut={handleSignOut}
          channels={channels}
          setChannels={setChannels}
          setNewChannelType={setNewChannelType}
          setNewChannelName={setNewChannelName}
          setIsCreateChannelOpen={setIsCreateChannelOpen}
          activeChannelId={activeChannelId}
          setActiveChannelId={setActiveChannelId}
          setActiveChannelName={setActiveChannelName}
          setActiveChannelType={setActiveChannelType}
          setChannelToDelete={setChannelToDelete}
          setIsDeleteChannelConfirmOpen={setIsDeleteChannelConfirmOpen}
          connectedVoiceChannel={connectedVoiceChannel}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isDeafened={isDeafened}
          setIsDeafened={setIsDeafened}
          setConnectedVoiceChannel={setConnectedVoiceChannel}
          activeChannelType={activeChannelType}
        />

        {/* Chat Area */}
        <ChatArea
          activeServerId={activeServerId}
          activeDmTab={activeDmTab}
          setActiveDmTab={setActiveDmTab}
          pendingIncoming={pendingIncoming}
          pendingOutgoing={pendingOutgoing}
          friendsList={friendsList}
          friendsSearchQuery={friendsSearchQuery}
          friendsSearchResults={friendsSearchResults}
          handleStartDm={handleStartDm}
          handleDeclineFriendRequest={handleDeclineFriendRequest}
          handleAcceptFriendRequest={handleAcceptFriendRequest}
          handleFriendsSearch={handleFriendsSearch}
          handleSendFriendRequest={handleSendFriendRequest}
          activeFriendsSubTab={activeFriendsSubTab}
          setActiveFriendsSubTab={setActiveFriendsSubTab}
          dmRecipient={dmRecipient}
          activeChannelType={activeChannelType}
          activeChannelName={activeChannelName}
          activeDmChannelId={activeDmChannelId}
          dmMessages={dmMessages}
          messages={messages}
          isLoading={isLoading}
          activeChannelId={activeChannelId}
          setActiveChannelId={setActiveChannelId}
          setActiveChannelName={setActiveChannelName}
          setActiveChannelType={setActiveChannelType}
          voiceParticipants={voiceParticipants}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isDeafened={isDeafened}
          setIsDeafened={setIsDeafened}
          isScreenSharing={isScreenSharing}
          startScreenShare={startScreenShare}
          stopScreenShare={stopScreenShare}
          setConnectedVoiceChannel={setConnectedVoiceChannel}
          channels={channels}
          dmInput={dmInput}
          setDmInput={setDmInput}
          handleSendDm={handleSendDm}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
          dmMessagesEndRef={dmMessagesEndRef}
        />
      </div>

      <Modals
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        handleSaveProfile={handleSaveProfile}
        profileName={profileName}
        setProfileName={setProfileName}
        profileAvatar={profileAvatar}
        setProfileAvatar={setProfileAvatar}
        profileBio={profileBio}
        setProfileBio={setProfileBio}
        isSavingProfile={isSavingProfile}
        accentColor={accentColor}
        handleColorChange={handleColorChange}
        isCreateServerOpen={isCreateServerOpen}
        setIsCreateServerOpen={setIsCreateServerOpen}
        joinInviteCode={joinInviteCode}
        setJoinInviteCode={setJoinInviteCode}
        newServerName={newServerName}
        setNewServerName={setNewServerName}
        handleCreateServer={handleCreateServer}
        handleJoinServer={handleJoinServer}
        isServerSettingsOpen={isServerSettingsOpen}
        setIsServerSettingsOpen={setIsServerSettingsOpen}
        editServerName={editServerName}
        setEditServerName={setEditServerName}
        editServerImage={editServerImage}
        setEditServerImage={setEditServerImage}
        handleSaveServerSettings={handleSaveServerSettings}
        isInviteOpen={isInviteOpen}
        setIsInviteOpen={setIsInviteOpen}
        activeServerId={activeServerId}
        servers={servers}
        isDmSearchOpen={isDmSearchOpen}
        setIsDmSearchOpen={setIsDmSearchOpen}
        userSearchQuery={userSearchQuery}
        handleUserSearch={handleUserSearch}
        userSearchResults={userSearchResults}
        handleStartDm={handleStartDm}
        isCreateChannelOpen={isCreateChannelOpen}
        setIsCreateChannelOpen={setIsCreateChannelOpen}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        isTypeDropdownOpen={isTypeDropdownOpen}
        setIsTypeDropdownOpen={setIsTypeDropdownOpen}
        newChannelType={newChannelType}
        setNewChannelType={setNewChannelType}
        handleCreateChannel={handleCreateChannel}
        isDeleteChannelConfirmOpen={isDeleteChannelConfirmOpen}
        setIsDeleteChannelConfirmOpen={setIsDeleteChannelConfirmOpen}
        channelToDelete={channelToDelete}
        handleDeleteChannel={handleDeleteChannel}
        isScreenPickerOpen={isScreenPickerOpen}
        setIsScreenPickerOpen={setIsScreenPickerOpen}
        screenSources={screenSources}
        selectScreenSource={selectScreenSource}
        voiceChannelToJoin={voiceChannelToJoin}
        setVoiceChannelToJoin={setVoiceChannelToJoin}
        setActiveChannelId={setActiveChannelId}
        setActiveChannelName={setActiveChannelName}
        setActiveChannelType={setActiveChannelType}
      />
    </React.Fragment>
  )
}
