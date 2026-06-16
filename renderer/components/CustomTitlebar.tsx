import React from 'react'
import { Minus, Square, X } from 'lucide-react'

export const CustomTitlebar = () => {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [isMac, setIsMac] = React.useState(false)

  React.useEffect(() => {
    setIsMac(window.navigator.userAgent.includes('Macintosh'))

    const checkMaximizedState = async () => {
      if (window.ipc) {
        try {
          const max = await window.ipc.invoke('window-is-maximized')
          setIsMaximized(!!max)
        } catch (e) {
          console.error(e)
        }
      }
    }

    checkMaximizedState()
    
    // Check maximized state on resize
    window.addEventListener('resize', checkMaximizedState)
    return () => window.removeEventListener('resize', checkMaximizedState)
  }, [])

  const handleMinimize = () => {
    if (window.ipc) {
      window.ipc.send('window-minimize')
    }
  }

  const handleMaximize = () => {
    if (window.ipc) {
      window.ipc.send('window-maximize')
    }
  }

  const handleClose = () => {
    if (window.ipc) {
      window.ipc.send('window-close')
    }
  }

  return (
    <div 
      className="h-8 w-full bg-card/70 border-b border-border/40 flex items-center justify-between shrink-0 select-none px-4 z-50 absolute top-0 left-0 right-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Title / Logo */}
      <div className="flex items-center gap-2">
        {/* If macOS, push text to right to not overlap native traffic lights (which are at top left) */}
        <div className={`flex items-center gap-2 ${isMac ? 'pl-[72px]' : ''}`}>
          <div className="h-4 w-4 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nuvio Workspace</span>
        </div>
      </div>

      {/* Custom Windows/Linux controls (rendered on non-Mac, or always if no native support) */}
      {!isMac && (
        <div 
          className="flex items-center h-full shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="h-full px-3 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition flex items-center justify-center cursor-pointer"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-3 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition flex items-center justify-center cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={handleClose}
            className="h-full px-3 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition flex items-center justify-center cursor-pointer"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
