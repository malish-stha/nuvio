import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Users, Hash, Volume2, Edit3, Terminal, ChevronDown, Play, Square, Trash2, Upload, Music, Bell, PhoneCall } from 'lucide-react'
import { THEME_PRESETS, CHANNEL_TYPES, ChannelType } from '../lib/constants'
import {
  playPreviewSound,
  stopPreviewSound,
  PRESET_MESSAGE_SOUNDS,
  PRESET_CALL_SOUNDS,
} from '../lib/sounds'

interface ModalsProps {
  // Settings Dialog
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
  settingsTab: 'profile' | 'theme' | 'sounds'
  setSettingsTab: (tab: 'profile' | 'theme' | 'sounds') => void
  handleSaveProfile: (e: React.FormEvent) => void
  profileName: string
  setProfileName: (name: string) => void
  profileAvatar: string
  setProfileAvatar: (avatar: string) => void
  profileBio: string
  setProfileBio: (bio: string) => void
  isSavingProfile: boolean
  accentColor: string
  handleColorChange: (color: string) => void
  
  // Sound Settings
  messageSoundId: string
  setMessageSoundId: (id: string) => void
  incomingRingId: string
  setIncomingRingId: (id: string) => void
  customSounds: any[]
  onUploadCustomSound: (name: string, type: 'message' | 'ringtone', blob: Blob) => Promise<void>
  onDeleteCustomSound: (id: string) => Promise<void>
  
  // Create / Join Server Dialog
  isCreateServerOpen: boolean
  setIsCreateServerOpen: (open: boolean) => void
  joinInviteCode: string
  setJoinInviteCode: (code: string) => void
  newServerName: string
  setNewServerName: (name: string) => void
  handleCreateServer: (e: React.FormEvent) => void
  handleJoinServer: (e: React.FormEvent) => void
  
  // Server Settings Dialog
  isServerSettingsOpen: boolean
  setIsServerSettingsOpen: (open: boolean) => void
  editServerName: string
  setEditServerName: (name: string) => void
  editServerImage: string
  setEditServerImage: (image: string) => void
  handleSaveServerSettings: (e: React.FormEvent) => void
  
  // Invite Dialog
  isInviteOpen: boolean
  setIsInviteOpen: (open: boolean) => void
  activeServerId: string
  servers: any[]
  
  // DM Search Dialog
  isDmSearchOpen: boolean
  setIsDmSearchOpen: (open: boolean) => void
  userSearchQuery: string
  handleUserSearch: (query: string) => void
  userSearchResults: any[]
  handleStartDm: (userId: string) => void
  
  // Create Channel Dialog
  isCreateChannelOpen: boolean
  setIsCreateChannelOpen: (open: boolean) => void
  newChannelName: string
  setNewChannelName: (name: string) => void
  isTypeDropdownOpen: boolean
  setIsTypeDropdownOpen: (open: boolean) => void
  newChannelType: ChannelType
  setNewChannelType: (type: ChannelType) => void
  handleCreateChannel: (e: React.FormEvent) => void
  
  // Delete Channel Dialog
  isDeleteChannelConfirmOpen: boolean
  setIsDeleteChannelConfirmOpen: (open: boolean) => void
  channelToDelete: any
  handleDeleteChannel: () => void
  
  // Screen Share Dialog (picker)
  isScreenPickerOpen: boolean
  setIsScreenPickerOpen: (open: boolean) => void
  screenSources: any[]
  selectScreenSource: (sourceId: string) => void
  
  // Voice Join Confirm Dialog
  voiceChannelToJoin: any
  setVoiceChannelToJoin: (channel: any) => void
  setActiveChannelId: (id: string) => void
  setActiveChannelName: (name: string) => void
  setActiveChannelType: (type: string) => void
  incomingCall: { caller: any; dmChannelId: string } | null
  handleAcceptCall: () => void
  handleDeclineCall: () => void
}

export const Modals = ({
  isSettingsOpen,
  setIsSettingsOpen,
  settingsTab,
  setSettingsTab,
  handleSaveProfile,
  profileName,
  setProfileName,
  profileAvatar,
  setProfileAvatar,
  profileBio,
  setProfileBio,
  isSavingProfile,
  accentColor,
  handleColorChange,
  messageSoundId,
  setMessageSoundId,
  incomingRingId,
  setIncomingRingId,
  customSounds,
  onUploadCustomSound,
  onDeleteCustomSound,
  isCreateServerOpen,
  setIsCreateServerOpen,
  joinInviteCode,
  setJoinInviteCode,
  newServerName,
  setNewServerName,
  handleCreateServer,
  handleJoinServer,
  isServerSettingsOpen,
  setIsServerSettingsOpen,
  editServerName,
  setEditServerName,
  editServerImage,
  setEditServerImage,
  handleSaveServerSettings,
  isInviteOpen,
  setIsInviteOpen,
  activeServerId,
  servers,
  isDmSearchOpen,
  setIsDmSearchOpen,
  userSearchQuery,
  handleUserSearch,
  userSearchResults,
  handleStartDm,
  isCreateChannelOpen,
  setIsCreateChannelOpen,
  newChannelName,
  setNewChannelName,
  isTypeDropdownOpen,
  setIsTypeDropdownOpen,
  newChannelType,
  setNewChannelType,
  handleCreateChannel,
  isDeleteChannelConfirmOpen,
  setIsDeleteChannelConfirmOpen,
  channelToDelete,
  handleDeleteChannel,
  isScreenPickerOpen,
  setIsScreenPickerOpen,
  screenSources,
  selectScreenSource,
  voiceChannelToJoin,
  setVoiceChannelToJoin,
  setActiveChannelId,
  setActiveChannelName,
  setActiveChannelType,
  incomingCall,
  handleAcceptCall,
  handleDeclineCall
}: ModalsProps) => {
  const [uploadName, setUploadName] = React.useState('')
  const [uploadType, setUploadType] = React.useState<'message' | 'ringtone'>('message')
  const [activePreviewId, setActivePreviewId] = React.useState<string | null>(null)
  const [activePreviewType, setActivePreviewType] = React.useState<'message' | 'ringtone' | null>(null)

  React.useEffect(() => {
    if (!isSettingsOpen) {
      stopPreviewSound()
      setActivePreviewId(null)
      setActivePreviewType(null)
    }
  }, [isSettingsOpen])

  const handleTogglePreview = async (soundId: string, type: 'message' | 'ringtone') => {
    if (activePreviewId === soundId && activePreviewType === type) {
      stopPreviewSound()
      setActivePreviewId(null)
      setActivePreviewType(null)
    } else {
      setActivePreviewId(soundId)
      setActivePreviewType(type)
      await playPreviewSound(soundId, type)
      if (type === 'message') {
        setTimeout(() => {
          setActivePreviewId((prev) => (prev === soundId ? null : prev))
          setActivePreviewType((prev) => (prev === type ? null : prev))
        }, 1500)
      }
    }
  }

  return (
    <>
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
              onClick={() => {
                setSettingsTab('profile')
                stopPreviewSound()
                setActivePreviewId(null)
                setActivePreviewType(null)
              }}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer transition ${settingsTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              My Profile
            </button>
            <button
              onClick={() => {
                setSettingsTab('theme')
                stopPreviewSound()
                setActivePreviewId(null)
                setActivePreviewType(null)
              }}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer transition ${settingsTab === 'theme'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              App Theme
            </button>
            <button
              onClick={() => {
                setSettingsTab('sounds')
                stopPreviewSound()
                setActivePreviewId(null)
                setActivePreviewType(null)
              }}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 cursor-pointer transition ${settingsTab === 'sounds'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              Sounds
            </button>
          </div>

          {settingsTab === 'profile' && (
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
          )}

          {settingsTab === 'theme' && (
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
                  {THEME_PRESETS.map((preset) => (
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

          {settingsTab === 'sounds' && (
            <div className="space-y-4 py-2 text-foreground overflow-y-auto max-h-[420px] pr-1">
              {/* Message Notification Sound Select */}
              <div className="p-3.5 rounded-xl border border-border bg-background/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">Message Notification Sound</p>
                </div>
                <div className="flex items-center gap-2 select-none">
                  <div className="flex-1 relative">
                    <select
                      value={messageSoundId}
                      onChange={(e) => {
                        setMessageSoundId(e.target.value)
                        stopPreviewSound()
                        setActivePreviewId(null)
                      }}
                      className="w-full bg-[#1e1f22] border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer font-semibold appearance-none pr-8"
                    >
                      <optgroup label="Presets">
                        {PRESET_MESSAGE_SOUNDS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </optgroup>
                      {customSounds.filter(s => s.type === 'message').length > 0 && (
                        <optgroup label="Custom Uploads">
                          {customSounds.filter(s => s.type === 'message').map((custom) => (
                            <option key={custom.id} value={custom.id}>
                              {custom.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => handleTogglePreview(messageSoundId, 'message')}
                    className={`h-9 w-9 rounded-xl border cursor-pointer flex items-center justify-center transition ${
                      activePreviewId === messageSoundId && activePreviewType === 'message'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {activePreviewId === messageSoundId && activePreviewType === 'message' ? (
                      <Square className="h-4 w-4 fill-current animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                  </button>
                </div>
              </div>

              {/* Call Ringtone Sound Select */}
              <div className="p-3.5 rounded-xl border border-border bg-background/50 space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">Incoming Call Ringtone</p>
                </div>
                <div className="flex items-center gap-2 select-none">
                  <div className="flex-1 relative">
                    <select
                      value={incomingRingId}
                      onChange={(e) => {
                        setIncomingRingId(e.target.value)
                        stopPreviewSound()
                        setActivePreviewId(null)
                        setActivePreviewType(null)
                      }}
                      className="w-full bg-[#1e1f22] border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer font-semibold appearance-none pr-8"
                    >
                      <optgroup label="Presets">
                        {PRESET_CALL_SOUNDS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </optgroup>
                      {customSounds.filter(s => s.type === 'ringtone').length > 0 && (
                        <optgroup label="Custom Uploads">
                          {customSounds.filter(s => s.type === 'ringtone').map((custom) => (
                            <option key={custom.id} value={custom.id}>
                              {custom.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => handleTogglePreview(incomingRingId, 'ringtone')}
                    className={`h-9 w-9 rounded-xl border cursor-pointer flex items-center justify-center transition ${
                      activePreviewId === incomingRingId && activePreviewType === 'ringtone'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {activePreviewId === incomingRingId && activePreviewType === 'ringtone' ? (
                      <Square className="h-4 w-4 fill-current animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Custom Audio File */}
              <div className="p-3.5 rounded-xl border border-border bg-background/50 space-y-3">
                <div>
                  <p className="text-xs font-bold">Upload Custom Sound</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Upload an MP3/WAV file (Max size 5MB) to use in dropdown lists
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Sound Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as 'message' | 'ringtone')}
                      className="w-full bg-[#1e1f22] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none font-semibold cursor-pointer"
                    >
                      <option value="message">Message Chime</option>
                      <option value="ringtone">Call Ringtone</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. My Ping Sound"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="relative border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-background/20 hover:bg-background/40 hover:border-primary/50 transition cursor-pointer select-none">
                  <input
                    type="file"
                    accept="audio/mp3, audio/wav, audio/mpeg, audio/ogg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File size exceeds 5MB limit.')
                        return
                      }
                      const finalName = uploadName.trim() || file.name.replace(/\.[^/.]+$/, "")
                      await onUploadCustomSound(finalName, uploadType, file)
                      setUploadName('')
                      e.target.value = ''
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Click to upload audio file</span>
                </div>
              </div>

              {/* Uploaded Custom Sounds list */}
              {customSounds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    My Custom Sounds ({customSounds.length})
                  </p>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 select-none">
                    {customSounds.map((sound) => (
                      <div
                        key={sound.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-border bg-background/30 hover:border-primary/25 transition text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Music className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold truncate leading-none mb-0.5">{sound.name}</p>
                            <p className="text-[8px] text-muted-foreground uppercase leading-none font-semibold">
                              {sound.type === 'message' ? 'Message' : 'Ringtone'} • {(sound.blob.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePreview(sound.id, sound.type)}
                            className={`h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition border ${
                              activePreviewId === sound.id && activePreviewType === sound.type
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {activePreviewId === sound.id && activePreviewType === sound.type ? (
                              <Square className="h-3 w-3 fill-current animate-pulse" />
                            ) : (
                              <Play className="h-3 w-3 fill-current" />
                            )}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete custom sound "${sound.name}"?`)) {
                                if (activePreviewId === sound.id) {
                                  stopPreviewSound()
                                  setActivePreviewId(null)
                                }
                                await onDeleteCustomSound(sound.id)
                              }
                            }}
                            className="h-7 w-7 rounded-md border border-border bg-background/50 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer flex items-center justify-center transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  {newChannelType === CHANNEL_TYPES.TEXT ? (
                    <>
                      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Text Channel</span>
                    </>
                  ) : newChannelType === CHANNEL_TYPES.VOICE ? (
                    <>
                      <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Voice Channel</span>
                    </>
                  ) : newChannelType === CHANNEL_TYPES.WHITEBOARD ? (
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
                    { type: CHANNEL_TYPES.TEXT, label: 'Text Channel', description: 'Post messages, images, and links', icon: Hash },
                    { type: CHANNEL_TYPES.VOICE, label: 'Voice Channel', description: 'Hang out in real-time with voice and audio lounge', icon: Volume2 },
                    { type: CHANNEL_TYPES.WHITEBOARD, label: 'Drawing Whiteboard', description: 'Collaborative sketch space and visual design board', icon: Edit3 },
                    { type: CHANNEL_TYPES.PLAYGROUND, label: 'Code Playground', description: 'Execute JS code snippets in an interactive sandbox', icon: Terminal }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setNewChannelType(opt.type)
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

      {/* Screen Source Picker Modal for Electron Screen Sharing */}
      <Dialog open={isScreenPickerOpen} onOpenChange={setIsScreenPickerOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Share Your Screen</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Select a screen or application window to share with participants in the voice channel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 max-h-[360px] overflow-y-auto p-2 mt-2 select-none">
            {screenSources.map((source) => (
              <div
                key={source.id}
                onClick={() => {
                  setIsScreenPickerOpen(false)
                  selectScreenSource(source.id)
                }}
                className="flex flex-col items-center p-2 rounded-xl border border-border hover:border-primary/50 bg-background/50 hover:bg-primary/5 cursor-pointer transition"
              >
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-border/40 bg-black/40 flex items-center justify-center mb-2">
                  <img src={source.thumbnailUrl} alt={source.name} className="max-h-full max-w-full object-contain" />
                </div>
                <span className="text-[10px] font-bold text-center truncate w-full px-1">{source.name}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsScreenPickerOpen(false)}
              className="w-full sm:w-auto h-10 px-5 bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voice Connection Confirmation Modal */}
      <Dialog open={!!voiceChannelToJoin} onOpenChange={(open) => { if (!open) setVoiceChannelToJoin(null) }}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl text-foreground select-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Join Voice Channel</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1.5">
              Would you like to connect to the voice channel <span className="font-extrabold text-foreground">#{voiceChannelToJoin?.name}</span>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setVoiceChannelToJoin(null)}
              className="w-full sm:w-auto h-10 px-5 bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (voiceChannelToJoin) {
                  setActiveChannelId(voiceChannelToJoin.id)
                  setActiveChannelName(voiceChannelToJoin.name)
                  setActiveChannelType(CHANNEL_TYPES.VOICE)
                  setVoiceChannelToJoin(null)
                }
              }}
              className="w-full sm:w-auto h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Join Channel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incoming Call Popup Modal */}
      <Dialog open={!!incomingCall} onOpenChange={(open) => { if (!open) handleDeclineCall() }}>
        <DialogContent className="max-w-xs sm:max-w-sm bg-card/95 border border-border rounded-3xl text-foreground select-none backdrop-blur-md shadow-2xl p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-1000 scale-150 opacity-40" />
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse scale-125 opacity-60" />
            
            <Avatar className="h-24 w-24 ring-4 ring-emerald-500/30 relative z-10">
              <AvatarImage src={incomingCall?.caller?.imageUrl || undefined} />
              <AvatarFallback className="bg-primary/15 text-primary text-3xl font-extrabold flex items-center justify-center">
                <PhoneCall className="h-10 w-10 text-emerald-500 animate-bounce" />
              </AvatarFallback>
            </Avatar>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground">{incomingCall?.caller?.fullName || 'Incoming Voice Call'}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Incoming call...
          </p>

          <div className="mt-6 flex w-full gap-3 justify-center">
            <button
              onClick={handleDeclineCall}
              className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition active:scale-95 cursor-pointer shadow-lg shadow-rose-600/10 flex items-center justify-center gap-1.5"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptCall}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
            >
              Accept
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
