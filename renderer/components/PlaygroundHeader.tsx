

interface PlaygroundHeaderProps {
  language: string
  onLanguageChange: (lang: string) => void
  onClearLogs: () => void
  onRunCode: () => void
  isRunning: boolean
  syncState: 'synced' | 'typing' | 'loading'
  collaboratorTyping: boolean
}

export const PlaygroundHeader = ({
  language,
  onLanguageChange,
  onClearLogs,
  onRunCode,
  isRunning,
  syncState,
  collaboratorTyping
}: PlaygroundHeaderProps) => {
  return (
    <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10 select-none">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Language</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-card border border-border text-foreground text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-muted/30 transition"
          >
            <option value="javascript">JavaScript (ES6)</option>
            <option value="html">HTML / CSS component</option>
          </select>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`h-2 w-2 rounded-full ${
            syncState === 'loading'
              ? 'bg-amber-500 animate-pulse'
              : syncState === 'typing'
              ? 'bg-sky-500 animate-ping'
              : 'bg-emerald-500'
          }`} />
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {syncState === 'loading' ? 'Loading' : syncState === 'typing' ? 'Saving...' : 'Saved to Cloud'}
          </span>
        </div>

        {/* Collaborator Typing Banner */}
        {collaboratorTyping && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1 text-[10px] font-bold animate-pulse">
            <span>Someone is typing...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onClearLogs}
          className="bg-muted hover:bg-muted/80 text-muted-foreground px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          Clear Logs
        </button>
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
    </div>
  )
}
