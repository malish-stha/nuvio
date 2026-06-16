

interface CalendarGridProps {
  currentDate: Date
  events: any[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

export const CalendarGrid = ({
  currentDate,
  events,
  selectedDate,
  onSelectDate
}: CalendarGridProps) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay()
  
  // Total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate()
  
  // Array of day names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Create blank cells before the first day
  const blanks = Array(firstDayIndex).fill(null)
  
  // Create days list
  const days = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))
  
  const calendarCells = [...blanks, ...days]

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
  }

  // Find events on a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.startTime)
      return eDate.getDate() === date.getDate() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getFullYear() === date.getFullYear()
    })
  }

  return (
    <div className="flex-1 bg-card/40 rounded-2xl border border-border/40 p-6 flex flex-col h-full overflow-hidden select-none">
      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-4 text-center">
        {weekdays.map(day => (
          <span key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-widest py-2">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-2.5 flex-1 auto-rows-fr overflow-y-auto">
        {calendarCells.map((cell, idx) => {
          if (cell === null) {
            return <div key={`blank-${idx}`} className="bg-muted/5 rounded-xl border border-transparent" />
          }

          const dateEvents = getEventsForDate(cell)
          const today = isToday(cell)
          const selected = isSelected(cell)

          return (
            <div
              key={`day-${cell.getDate()}`}
              onClick={() => onSelectDate(cell)}
              className={`rounded-xl border p-2.5 flex flex-col transition cursor-pointer relative min-h-[64px] ${
                selected
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                  : today
                  ? 'border-primary/40 bg-muted/40 hover:bg-muted/60'
                  : 'border-border/30 bg-muted/10 hover:bg-muted/30'
              }`}
            >
              {/* Day Number */}
              <span className={`text-xs font-bold font-mono h-6 w-6 rounded-full flex items-center justify-center ${
                today ? 'bg-primary text-primary-foreground font-black' : 'text-foreground'
              }`}>
                {cell.getDate()}
              </span>

              {/* Day Events Indicator Dot/List */}
              <div className="flex-1 flex flex-col justify-end gap-1 mt-1.5 overflow-hidden">
                {dateEvents.slice(0, 2).map((e: any) => (
                  <div 
                    key={e.id}
                    className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 truncate max-w-full leading-none"
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
                {dateEvents.length > 2 && (
                  <div className="text-[8px] font-extrabold text-muted-foreground pl-1">
                    +{dateEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
