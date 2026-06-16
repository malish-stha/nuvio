import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export const PlaygroundView = () => {
  const [code, setCode] = React.useState(`// Nuvio Collaborative Code Playground
// Write your JavaScript/HTML code here and click Run!

function calculateSplit(total, people) {
  const split = total / people;
  console.log("Each person owes: $" + split.toFixed(2));
  return split;
}

calculateSplit(150.50, 4);`)
  const [consoleLogs, setConsoleLogs] = React.useState<string[]>([
    'Nuvio Compiler loaded successfully.',
    'Ready to run code snippets.'
  ])
  const [isRunning, setIsRunning] = React.useState(false)
  const [language, setLanguage] = React.useState('javascript')

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
    if (lang === 'javascript') {
      setCode(`// Nuvio Collaborative Code Playground
// Write your JavaScript/HTML code here and click Run!

function calculateSplit(total, people) {
  const split = total / people;
  console.log("Each person owes: $" + split.toFixed(2));
  return split;
}

calculateSplit(150.50, 4);`)
    } else {
      setCode(`<!-- Nuvio UI Component Preview -->
<div class="card p-5 bg-slate-800 rounded-xl border border-slate-700 text-white shadow-xl">
  <h2 class="text-xl font-bold mb-2">Welcome to Nuvio Dashboard</h2>
  <p class="text-sm text-slate-400">Collaboration built directly for developers.</p>
  <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mt-4 text-xs font-bold transition">Click me</button>
</div>`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="h-full flex flex-col bg-muted/10 select-none overflow-hidden">
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Language</span>
          <select
            value={language}
            onChange={(e) => loadTemplate(e.target.value)}
            className="bg-card border border-border text-foreground text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer"
          >
            <option value="javascript">JavaScript (ES6)</option>
            <option value="html">HTML / CSS component</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConsoleLogs(['Terminal console logs cleared.'])}
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Clear Logs
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-border flex flex-col h-full bg-[#1e1e2e]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-100 font-mono text-xs p-6 outline-none resize-none leading-relaxed overflow-y-auto"
            style={{ tabSize: 2 }}
          />
        </div>

        <div className="w-96 flex flex-col bg-[#11111b] h-full">
          <div className="h-9 border-b border-[#181825] px-4 flex items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Console Logs</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="font-mono text-xs text-slate-300 space-y-2 select-text">
              {consoleLogs.map((log, idx) => (
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
      </div>
    </div>
  )
}
