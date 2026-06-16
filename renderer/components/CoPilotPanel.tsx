import React from 'react'
import { Sparkles, X, AlertTriangle } from 'lucide-react'
import { isClerkConfigured } from '../lib/clerk-fallback'
import { SummarySection } from './SummarySection'
import { DraftReplyBox } from './DraftReplyBox'

interface CoPilotPanelProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
  getToken: () => Promise<string | null>
  onUseDraft: (text: string) => void
}

export const CoPilotPanel = ({
  channelId,
  isOpen,
  onClose,
  getToken,
  onUseDraft
}: CoPilotPanelProps) => {
  const [summary, setSummary] = React.useState('')
  const [draft, setDraft] = React.useState('')
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false)
  const [isDraftLoading, setIsDraftLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState('')

  // Reset states when channel changes
  React.useEffect(() => {
    setSummary('')
    setDraft('')
    setErrorMsg('')
  }, [channelId])

  if (!isOpen) return null

  const handleAction = async (action: 'summarize' | 'draft') => {
    setErrorMsg('')
    if (action === 'summarize') {
      setIsSummaryLoading(true)
    } else {
      setIsDraftLoading(true)
    }

    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ channelId, action })
      })

      const data = await res.json()
      
      if (!res.ok) {
        if (data.error === 'AI_NOT_CONFIGURED') {
          setErrorMsg(data.message)
        } else {
          setErrorMsg(data.error || 'Failed to compile AI response.')
        }
        return
      }

      if (action === 'summarize') {
        setSummary(data.result)
      } else {
        setDraft(data.result)
      }
    } catch (err: any) {
      console.error('Co-Pilot action failed:', err)
      setErrorMsg(err.message || 'An error occurred during communication.')
    } finally {
      setIsSummaryLoading(false)
      setIsDraftLoading(false)
    }
  }

  return (
    <div className="w-80 border-l border-border bg-card/20 h-full flex flex-col shrink-0 select-none overflow-hidden animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold text-foreground uppercase tracking-widest leading-none">AI Co-Pilot</span>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/40 p-1.5 rounded-lg transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Drawer Scroll Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Warning Banner if Gemini API is missing or fails */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3 flex gap-2.5 text-[10px] leading-relaxed font-semibold select-text">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-rose-300">Co-Pilot Issue</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Summarize Widget */}
        <SummarySection
          summary={summary}
          onSummarize={() => handleAction('summarize')}
          isLoading={isSummaryLoading}
        />

        {/* Drafting Auto-Responder Widget */}
        <DraftReplyBox
          draft={draft}
          onDraft={() => handleAction('draft')}
          isLoading={isDraftLoading}
          onUseDraft={onUseDraft}
        />
      </div>
    </div>
  )
}
