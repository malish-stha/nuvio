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
} from '@/components/ui/dialog'
import { applyPrimaryThemeColor } from '../lib/theme'
import { useAuth, useUser, SignIn } from '@clerk/clerk-react'
import { useMockUser, isClerkConfigured } from '../lib/clerk-fallback'
import { pusherClient } from '../lib/pusher-client'

export default function HomePage() {
  const { getToken, userId: clerkUserId } = isClerkConfigured ? useAuth() : { getToken: async () => 'mock-token', userId: 'mock-user-12345' }
  const { user: clerkUser } = isClerkConfigured ? useUser() : { user: null }
  const mockContext = isClerkConfigured ? null : useMockUser()

  const activeUserId = isClerkConfigured ? clerkUserId : mockContext?.user?.id
  const activeUserFullName = isClerkConfigured ? clerkUser?.fullName : mockContext?.user?.fullName
  const activeUserImage = isClerkConfigured ? clerkUser?.imageUrl : mockContext?.user?.imageUrl


  const [accentColor, setAccentColor] = React.useState('#5865F2') // Default Discord blurple hex
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

  // Channels, messages and text inputs states
  const [channels, setChannels] = React.useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = React.useState<string>('')
  const [activeChannelName, setActiveChannelName] = React.useState<string>('general')
  const [messages, setMessages] = React.useState<any[]>([])
  const [chatInput, setChatInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

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
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels)
          const generalChan = data.channels.find((c: any) => c.name === 'general')
          const initialChan = generalChan || data.channels[0]
          setActiveChannelId(initialChan.id)
          setActiveChannelName(initialChan.name)
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
    if (pusherClient && activeChannelId) {
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
    }
  }, [activeChannelId])

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

  if (isClerkConfigured && !clerkUserId) {
    return (
      <div className="flex h-screen w-screen bg-[#070a12] items-center justify-center">
        <SignIn routing="hash" forceRedirectUrl="/home" />
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
        <aside className="w-[72px] bg-muted flex flex-col items-center py-4 space-y-4 border-r border-border shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg cursor-pointer hover:rounded-xl transition-all duration-300 shadow-lg shadow-primary/20">
                  N
                </div>
              }
            />
            <TooltipContent side="right">Nuvio Workspace</TooltipContent>
          </Tooltip>

          <div className="w-8 h-[2px] bg-border rounded" />

          <Tooltip>
            <TooltipTrigger
              render={
                <div className="w-12 h-12 rounded-3xl bg-card hover:bg-primary/20 flex items-center justify-center text-primary font-medium text-xl cursor-pointer hover:text-foreground hover:rounded-xl transition-all duration-300 border border-border">
                  +
                </div>
              }
            />
            <TooltipContent side="right">Create a Server</TooltipContent>
          </Tooltip>
        </aside>

        {/* Workspace Channels Sidebar */}
        <aside className="w-60 bg-card/60 flex flex-col border-r border-border shrink-0">
          <div className="h-12 border-b border-border flex items-center px-4 font-bold tracking-wide shadow-sm justify-between">
            <span>Nuvio Workspace</span>
          </div>

          <ScrollArea className="flex-1 px-2 py-3">
            <div className="space-y-4">
              <div>
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Text Channels
                </div>
                <div className="space-y-0.5 mt-1">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id)
                        setActiveChannelName(ch.name)
                      }}
                      className={`px-3 py-2 rounded-md font-medium text-sm cursor-pointer flex items-center transition ${activeChannelId === ch.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <span className={`mr-2 font-semibold ${activeChannelId === ch.id ? 'text-primary/70' : 'text-muted-foreground/60'}`}>#</span>
                      {ch.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Voice Channels
                </div>
                <div className="space-y-0.5 mt-1">
                  <div className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm cursor-pointer transition flex items-center">
                    <span className="mr-2 text-muted-foreground/60 font-semibold">🔊</span> Voice Lounge
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* User Profile Bar */}
          <div className="h-[52px] bg-muted/50 border-t border-border flex items-center px-3 justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={activeUserImage || undefined} alt={activeUserFullName || ''} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {(activeUserFullName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate leading-none mb-0.5 text-foreground">{activeUserFullName || 'Admin User'}</p>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Owner</p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/40 transition cursor-pointer active:scale-95 text-lg"
              title="Open Settings"
            >
              ⚙️
            </button>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background">
          <header className="h-12 border-b border-border flex items-center px-6 font-semibold shadow-sm justify-between shrink-0">
            <div className="flex items-center space-x-2 select-none">
              <span className="text-muted-foreground font-semibold text-lg">#</span>
              <span>{activeChannelName}</span>
            </div>
          </header>

          {/* Messages Log */}
          <div className="flex-1 relative overflow-hidden">
            <ScrollArea className="h-full w-full px-6 py-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
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
                    <div key={msg.id} className="flex items-start space-x-3.5 hover:bg-muted/20 p-1 rounded-md transition-colors">
                      <Avatar className="h-9 w-9 mt-0.5">
                        <AvatarImage src={msg.member?.user?.imageUrl || undefined} />
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-extrabold">
                          {(msg.member?.user?.fullName || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xs font-bold hover:underline cursor-pointer">{msg.member?.user?.fullName || 'Anonymous'}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed break-words">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Form Input */}
          <div className="px-6 pb-6 pt-2 shrink-0">
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
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Theme Customization</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Change the look and feel of your desktop experience. Choosing a custom color dynamically re-renders all buttons, hover outlines, and text links.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}
