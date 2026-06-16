import React from 'react'

export const WhiteboardView = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [color, setColor] = React.useState('#5865F2')
  const [lineWidth, setLineWidth] = React.useState(4)
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      canvas.width = (rect?.width || 800) * 2
      canvas.height = (rect?.height || 500) * 2
      canvas.style.width = `${rect?.width || 800}px`
      canvas.style.height = `${rect?.height || 500}px`
      
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(2, 2)
      context.lineCap = 'round'
      context.strokeStyle = color
      context.lineWidth = lineWidth
      contextRef.current = context
      
      context.fillStyle = '#0f172a'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    const timer = setTimeout(updateSize, 100)
    window.addEventListener('resize', updateSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  React.useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color
      contextRef.current.lineWidth = lineWidth
    }
  }, [color, lineWidth])

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent
    contextRef.current?.beginPath()
    contextRef.current?.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const { offsetX, offsetY } = nativeEvent
    contextRef.current?.lineTo(offsetX, offsetY)
    contextRef.current?.stroke()
  }

  const stopDrawing = () => {
    contextRef.current?.closePath()
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !contextRef.current) return
    contextRef.current.fillStyle = '#0f172a'
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height)
  }

  const colors = ['#5865F2', '#E11D48', '#9333EA', '#2563EB', '#16A34A', '#D97706', '#FFFFFF']

  return (
    <div className="h-full flex flex-col bg-[#0f172a] relative overflow-hidden select-none">
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Colors</span>
          <div className="flex items-center gap-1.5">
            {colors.map(col => (
              <button
                key={col}
                onClick={() => setColor(col)}
                className={`h-6 w-6 rounded-full border-2 transition cursor-pointer ${
                  color === col ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thickness</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-xs font-mono text-foreground w-4">{lineWidth}px</span>
          </div>
          
          <button
            onClick={clearCanvas}
            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0f172a]">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="block cursor-crosshair h-full w-full"
        />
      </div>
    </div>
  )
}
