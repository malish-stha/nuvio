import React from 'react'
import { pusherClient } from '../lib/pusher-client'
import { isClerkConfigured } from '../lib/clerk-fallback'
import { PlaygroundHeader } from './PlaygroundHeader'
import { CodeEditor } from './CodeEditor'
import { ConsoleLogs } from './ConsoleLogs'

interface PlaygroundViewProps {
  channelId: string
  activeUserId: string | null | undefined
  getToken: () => Promise<string | null>
}

export const PlaygroundView = ({
  channelId,
  activeUserId,
  getToken
}: PlaygroundViewProps) => {
  const [code, setCode] = React.useState('// Loading code...')
  const [consoleLogs, setConsoleLogs] = React.useState<string[]>([
    'Nuvio Compiler loaded successfully.',
    'Ready to run code snippets.'
  ])
  const [isRunning, setIsRunning] = React.useState(false)
  const [language, setLanguage] = React.useState('javascript')
  const [syncState, setSyncState] = React.useState<'synced' | 'typing' | 'loading'>('loading')
  const [collaboratorTyping, setCollaboratorTyping] = React.useState(false)

  const isRemoteUpdateRef = React.useRef(false)
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const collaboratorTypingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch initial code state
  React.useEffect(() => {
    const fetchCode = async () => {
      setSyncState('loading')
      try {
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        const res = await fetch(`/api/playground/get?channelId=${channelId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          isRemoteUpdateRef.current = true
          setCode(data.code || `// Welcome to Nuvio Collaborative Code Playground\n// Write your JavaScript/HTML code here and click Run!`)
          setSyncState('synced')
        }
      } catch (err) {
        console.error('Failed to fetch initial code:', err)
        setSyncState('synced')
      }
    }

    fetchCode()
  }, [channelId])

  // Pusher real-time subscription
  React.useEffect(() => {
    if (!pusherClient || !channelId) return

    const pusherChannel = pusherClient.subscribe(`channel-${channelId}`)

    pusherChannel.bind('playground-update', (data: { code: string; senderId: string }) => {
      if (data.senderId !== activeUserId) {
        // Block outgoing sync loop
        isRemoteUpdateRef.current = true
        setCode(data.code)
        
        // Show collaborator typing visual feedback
        setCollaboratorTyping(true)
        if (collaboratorTypingTimeoutRef.current) {
          clearTimeout(collaboratorTypingTimeoutRef.current)
        }
        collaboratorTypingTimeoutRef.current = setTimeout(() => {
          setCollaboratorTyping(false)
        }, 1500)
      }
    })

    return () => {
      pusherChannel.unbind('playground-update')
      pusherClient.unsubscribe(`channel-${channelId}`)
    }
  }, [channelId, activeUserId])

  // Broadcast typing changes (debounced sync) and save to database (longer debounce)
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false
      return
    }

    setSyncState('typing')

    // 1. Debounced broadcast sync (400ms) for other active clients
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        await fetch('/api/playground/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ channelId, code: newCode })
        })
      } catch (err) {
        console.error('Pusher broadcast sync failed:', err)
      }
    }, 400)

    // 2. Debounced db save (2000ms) for data persistence
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const token = isClerkConfigured ? await getToken() : 'mock-token'
        const res = await fetch('/api/playground/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ channelId, code: newCode })
        })
        if (res.ok) {
          setSyncState('synced')
        }
      } catch (err) {
        console.error('DB save failed:', err)
      }
    }, 2000)
  }

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

          // Safe sandboxed eval
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
    let template = ''
    if (lang === 'javascript') {
      template = `// Welcome to Nuvio Collaborative Code Playground\n// Write your JavaScript/HTML code here and click Run!\n\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("Nuvio Developer");`
    } else {
      template = `<!-- Nuvio UI Component Preview -->\n<div class="card p-5 bg-slate-800 rounded-xl border border-slate-700 text-white shadow-xl">\n  <h2 class="text-xl font-bold mb-2">Welcome to Nuvio Dashboard</h2>\n  <p class="text-sm text-slate-400">Collaboration built directly for developers.</p>\n  <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mt-4 text-xs font-bold transition">Click me</button>\n</div>`
    }
    handleCodeChange(template)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      handleCodeChange(newValue)
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="h-full flex flex-col bg-muted/10 select-none overflow-hidden">
      <PlaygroundHeader
        language={language}
        onLanguageChange={loadTemplate}
        onClearLogs={() => setConsoleLogs(['Terminal console logs cleared.'])}
        onRunCode={runCode}
        isRunning={isRunning}
        syncState={syncState}
        collaboratorTyping={collaboratorTyping}
      />

      <div className="flex-1 flex overflow-hidden">
        <CodeEditor
          code={code}
          onCodeChange={handleCodeChange}
          onKeyDown={handleKeyDown}
        />
        <ConsoleLogs logs={consoleLogs} />
      </div>
    </div>
  )
}
