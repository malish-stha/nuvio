import { ScrollArea } from '@/components/ui/scroll-area'

interface ConsoleLogsProps {
  logs: string[]
}

export const ConsoleLogs = ({ logs }: ConsoleLogsProps) => {
  return (
    <div className="w-96 flex flex-col bg-[#11111b] h-full shrink-0 select-none">
      <div className="h-9 border-b border-[#181825] px-4 flex items-center shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Console Logs</span>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="font-mono text-xs text-slate-300 space-y-2 select-text">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`leading-relaxed break-all ${
                log.startsWith('[ERROR]')
                  ? 'text-rose-400'
                  : log.startsWith('[LOG]')
                  ? 'text-emerald-400'
                  : log.startsWith('>')
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
