import React from 'react'
import { X } from 'lucide-react'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description: string; startTime: string; endTime: string }) => void
  selectedDate: Date | null
}

export const EventModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDate
}: EventModalProps) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [startTime, setStartTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')

  // Sync state when date is selected or opened
  React.useEffect(() => {
    if (selectedDate && isOpen) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      
      const defaultStart = `${year}-${month}-${day}T09:00`
      const defaultEnd = `${year}-${month}-${day}T10:00`
      
      setStartTime(defaultStart)
      setEndTime(defaultEnd)
      setTitle('')
      setDescription('')
    }
  }, [selectedDate, isOpen])

  if (!isOpen) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startTime || !endTime) return
    onSubmit({ title, description, startTime, endTime })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0f131f] border border-border/60 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Schedule Server Event</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/40 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Sync, Pair Programming Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-medium px-3.5 py-2.5 rounded-xl outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea
              placeholder="e.g. Details of the agenda, tasks, or video channel URL"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-medium px-3.5 py-2.5 rounded-xl outline-none focus:border-primary transition h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-xl outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-xl outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
