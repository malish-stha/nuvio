import React from 'react'

interface CodeEditorProps {
  code: string
  onCodeChange: (code: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export const CodeEditor = ({
  code,
  onCodeChange,
  onKeyDown
}: CodeEditorProps) => {
  // Simple line numbering logic
  const lines = code.split('\n')

  return (
    <div className="flex-1 border-r border-border flex h-full bg-[#1e1e2e] font-mono text-xs overflow-hidden relative">
      {/* Line Numbers sidebar */}
      <div className="w-12 py-6 select-none bg-[#181825] text-slate-600 text-right pr-3 flex flex-col shrink-0">
        {lines.map((_, i) => (
          <div key={i} className="h-5 leading-relaxed font-semibold">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor Content Area */}
      <textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent text-slate-100 p-6 outline-none resize-none leading-relaxed overflow-y-auto h-full font-mono text-xs"
        style={{ tabSize: 2 }}
        placeholder="// Collaborative Playground. Type code here..."
      />
    </div>
  )
}
