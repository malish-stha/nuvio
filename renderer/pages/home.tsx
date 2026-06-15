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

export default function HomePage() {
  const [message, setMessage] = React.useState('No message found')
  const [accentColor, setAccentColor] = React.useState('#5865F2') // Default Discord blurple hex
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

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

  // Listen to Electron main IPC messages
  React.useEffect(() => {
    window.ipc.on<string>('message', (message) => {
      setMessage(message)
    })
  }, [])

  // Change color & update styles
  const handleColorChange = (hex: string) => {
    setAccentColor(hex)
    applyPrimaryThemeColor(hex)
  }

  // Predefined theme presets (expanded premium palette)
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

  return (
    <React.Fragment>
      <Head>
        <title>Nuvio - Discord Clone Dashboard</title>
      </Head>

      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/30">

        {/* Servers Sidebar (Standard Discord layout) */}
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
                  <div className="px-3 py-2 rounded-md bg-primary/10 text-primary font-medium text-sm cursor-pointer flex items-center transition">
                    <span className="mr-2 text-primary/70 font-semibold">#</span> general
                  </div>
                  <div className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm cursor-pointer transition flex items-center">
                    <span className="mr-2 text-muted-foreground/60 font-semibold">#</span> announcements
                  </div>
                  <div className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm cursor-pointer transition flex items-center">
                    <span className="mr-2 text-muted-foreground/60 font-semibold">#</span> developers
                  </div>
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

          {/* User Profile Bar (Settings Access point) */}
          <div className="h-[52px] bg-muted/50 border-t border-border flex items-center px-3 justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">U</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate leading-none mb-0.5 text-foreground">Admin User</p>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Owner</p>
              </div>
            </div>

            {/* Settings Trigger Icon */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/40 transition cursor-pointer active:scale-95"
              title="Open Settings"
            >
              ⚙️
            </button>
          </div>
        </aside>

        {/* Main Application Area */}
        <main className="flex-1 flex flex-col bg-background">
          <header className="h-12 border-b border-border flex items-center px-6 font-semibold shadow-sm justify-between shrink-0">
            <div className="flex items-center space-x-2 select-none">
              <span className="text-muted-foreground font-semibold">#</span>
              <span>general</span>
            </div>
          </header>

          <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
            <div className="max-w-md p-8 rounded-2xl border border-border bg-card/40 shadow-2xl backdrop-blur-md space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Nuvio Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your premium desktop framework is ready. Change the app's accent color dynamically below or via the settings cog.
                </p>
              </div>

              {/* Quick Preset Colors in Dashboard */}
              <div className="flex flex-wrap justify-center gap-2.5 py-2">
                {presets.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => handleColorChange(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`h-6 w-6 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition border border-black/30 relative flex items-center justify-center`}
                    title={preset.name}
                  >
                    {accentColor.toLowerCase() === preset.hex.toLowerCase() && (
                      <span className="h-1.5 w-1.5 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    window.ipc.send<string>('message', 'Hello Electron!')
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer"
                >
                  Test IPC Communication
                </button>
                <div className="text-xs text-muted-foreground">
                  Response from Electron: <span className="font-mono text-foreground font-bold">{message}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dynamic Theme Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Theme Customization</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Change the look and feel of your desktop experience. Choosing a custom color dynamically re-renders all buttons, hover outlines, and text links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Native Custom Color Picker Input */}
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

            {/* Presets Grid */}
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
