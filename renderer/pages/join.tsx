import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth, SignIn } from '@clerk/clerk-react'
import { useMockUser, isClerkConfigured } from '../lib/clerk-fallback'
import { Users, Compass, Check, X, ArrowRight, Loader2 } from 'lucide-react'

interface ServerInviteData {
  id: string
  name: string
  imageUrl: string | null
  inviteCode: string
  memberCount: number
  isMember: boolean
}

export default function JoinPage() {
  const router = useRouter()
  const { code } = router.query as { code?: string }

  const { getToken, userId: clerkUserId } = isClerkConfigured ? useAuth() : { getToken: async () => 'mock-token', userId: 'mock-user-12345' }
  const mockContext = isClerkConfigured ? null : useMockUser()
  const activeUserId = isClerkConfigured ? clerkUserId : mockContext?.user?.id

  const [inviteData, setInviteData] = React.useState<ServerInviteData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [joining, setJoining] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch invite details
  React.useEffect(() => {
    if (!code || !activeUserId) return

    const fetchInvite = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        const res = await fetch(`/api/servers/invite?code=${code}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setInviteData(data)
        } else {
          const errData = await res.json()
          setError(errData.error || 'Failed to fetch invitation details')
        }
      } catch (err) {
        console.error('Fetch invite error:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [code, activeUserId])

  const handleAccept = async () => {
    if (!code) return
    try {
      setJoining(true)
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/servers/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: code })
      })

      if (res.ok) {
        const server = await res.json()
        
        // Save navigation state to active server to redirect seamlessly
        const firstChannel = server.channels?.[0]
        localStorage.setItem('nuvio_nav_state', JSON.stringify({
          serverId: server.id,
          channelId: firstChannel?.id || '',
          channelName: firstChannel?.name || '',
          channelType: firstChannel?.type || 'TEXT',
          dmChannelId: '',
          dmTab: 'friends'
        }))

        router.push('/')
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to join server')
      }
    } catch (err) {
      console.error('Join server error:', err)
      setError('Failed to join the server due to network issue.')
    } finally {
      setJoining(false)
    }
  }

  const handleGoToWorkspace = () => {
    if (!inviteData) return
    localStorage.setItem('nuvio_nav_state', JSON.stringify({
      serverId: inviteData.id,
      channelId: '',
      channelName: '',
      channelType: 'TEXT',
      dmChannelId: '',
      dmTab: 'friends'
    }))
    router.push('/')
  }

  // Redirect unauthenticated users to Clerk / Mock sign-in screen
  if (isClerkConfigured && !clerkUserId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090b11]">
        <SignIn routing="hash" />
      </div>
    )
  }

  // Get server initials for background avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }

  return (
    <React.Fragment>
      <Head>
        <title>Nuvio - Server Invitation</title>
      </Head>

      <div className="h-screen w-screen flex items-center justify-center bg-radial from-[#1e2640] to-[#090b11] p-4 text-foreground">
        <div className="w-full max-w-md bg-card/60 border border-border/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-300">
          
          {/* Glowing Ambient Toplight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-primary blur-2xl opacity-60 rounded-full" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-semibold text-muted-foreground">Fetching invitation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-6">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">Invalid Invitation</h2>
                <p className="text-sm text-muted-foreground px-4">{error}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="py-2.5 px-6 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition active:scale-[0.98] cursor-pointer"
              >
                Go back Home
              </button>
            </div>
          ) : inviteData ? (
            <div className="w-full flex flex-col items-center text-center">
              {/* Server Avatar */}
              <div className="mb-6 relative group">
                {inviteData.imageUrl ? (
                  <img
                    src={inviteData.imageUrl}
                    alt={inviteData.name}
                    className="h-24 w-24 rounded-3xl object-cover shadow-lg border-2 border-border/40 transition group-hover:scale-105 duration-200"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-primary/80 to-purple-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border border-primary/40 transition group-hover:scale-105 duration-200">
                    {getInitials(inviteData.name)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-card border border-border/80 rounded-full p-1.5 shadow-md">
                  <Compass className="h-4 w-4 text-primary" />
                </div>
              </div>

              {/* Subheading */}
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                {inviteData.isMember ? "Already Joined" : "You've been invited!"}
              </p>

              {/* Server Details */}
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2 uppercase leading-snug">
                {inviteData.name}
              </h1>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/30 text-xs font-semibold text-muted-foreground mb-8 select-none">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>{inviteData.memberCount} {inviteData.memberCount === 1 ? 'member' : 'members'}</span>
              </div>

              {/* Dynamic Action Buttons */}
              {inviteData.isMember ? (
                <div className="w-full space-y-3">
                  <button
                    onClick={handleGoToWorkspace}
                    className="w-full py-3 px-5 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <span>Enter Server</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full py-2.5 px-5 rounded-2xl bg-muted/60 hover:bg-muted/80 text-foreground font-semibold transition active:scale-[0.98] cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <button
                    onClick={handleAccept}
                    disabled={joining}
                    className="w-full py-3 px-5 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/10"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Accept Invitation</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    disabled={joining}
                    className="w-full py-2.5 px-5 rounded-2xl bg-muted/60 hover:bg-muted/80 text-foreground font-semibold transition active:scale-[0.98] cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No invite code specified.
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  )
}
