import { Sparkles, FileText } from 'lucide-react'

interface SummarySectionProps {
  summary: string
  onSummarize: () => void
  isLoading: boolean
}

export const SummarySection = ({
  summary,
  onSummarize,
  isLoading
}: SummarySectionProps) => {
  return (
    <div className="bg-muted/10 border border-border/30 rounded-xl p-4 flex flex-col space-y-3 select-none">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-1.5 text-primary">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Channel Summary</span>
        </div>
        <button
          onClick={onSummarize}
          disabled={isLoading}
          className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {isLoading ? 'Summarizing...' : 'Summarize'}
        </button>
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed select-text font-medium min-h-[64px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-center select-none text-muted-foreground/60">
            <span className="animate-pulse">Analyzing recent discussion...</span>
          </div>
        ) : summary ? (
          <div className="whitespace-pre-line break-words space-y-1.5">
            {summary}
          </div>
        ) : (
          <p className="italic text-muted-foreground/50 text-center select-none py-4">
            Click Summarize to outline the latest messages.
          </p>
        )}
      </div>
    </div>
  )
}
