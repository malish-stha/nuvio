import React from 'react'
import { Check, Clipboard, Copy, MessageSquarePlus, Sparkles } from 'lucide-react'

interface DraftReplyBoxProps {
  draft: string
  onDraft: () => void
  isLoading: boolean
  onUseDraft: (text: string) => void
}

export const DraftReplyBox = ({
  draft,
  onDraft,
  isLoading,
  onUseDraft
}: DraftReplyBoxProps) => {
  const [editedDraft, setEditedDraft] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setEditedDraft(draft)
  }, [draft])

  const handleCopy = () => {
    if (!editedDraft) return
    navigator.clipboard.writeText(editedDraft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-muted/10 border border-border/30 rounded-xl p-4 flex flex-col space-y-3 select-none">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-1.5 text-primary">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Draft Responder</span>
        </div>
        <button
          onClick={onDraft}
          disabled={isLoading}
          className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {isLoading ? 'Drafting...' : 'Draft Response'}
        </button>
      </div>

      <div className="flex flex-col space-y-3.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-center text-muted-foreground/60 text-xs">
            <span className="animate-pulse">Compiling responder context...</span>
          </div>
        ) : editedDraft ? (
          <>
            <textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-medium px-3 py-2 rounded-xl outline-none focus:border-primary transition h-24 resize-none leading-relaxed select-text"
            />
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="bg-muted hover:bg-muted/80 text-muted-foreground p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => onUseDraft(editedDraft)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Paste drafted response into chat input"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span>Use Draft</span>
              </button>
            </div>
          </>
        ) : (
          <p className="italic text-muted-foreground/50 text-xs text-center py-4">
            Click Draft Response to write a contextual reply.
          </p>
        )}
      </div>
    </div>
  )
}
