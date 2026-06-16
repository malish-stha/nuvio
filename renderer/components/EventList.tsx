import React from 'react'
import { Calendar, Clock, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface EventListProps {
  events: any[]
  selectedDate: Date | null
  activeUserId: string | null | undefined
  onDeleteEvent: (eventId: string) => void
  onAddEventClick: () => void
}

export const EventList = ({
  events,
  selectedDate,
  activeUserId,
  onDeleteEvent,
  onAddEventClick
}: EventListProps) => {

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Filter events by selected date
  const filteredEvents = React.useMemo(() => {
    if (!selectedDate) return events
    return events.filter(e => {
      const eDate = new Date(e.startTime)
      return eDate.getDate() === selectedDate.getDate() &&
        eDate.getMonth() === selectedDate.getMonth() &&
        eDate.getFullYear() === selectedDate.getFullYear()
    })
  }, [events, selectedDate])

  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
    return `${start.toLocaleTimeString(undefined, options)} - ${end.toLocaleTimeString(undefined, options)}`
  }

  return (
    <div className="w-80 border-l border-border bg-card/20 h-full flex flex-col shrink-0 select-none overflow-hidden">
      {/* Header Info */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Schedule</span>
          <span className="text-xs font-bold truncate text-foreground leading-none">
            {selectedDate ? formatDateLabel(selectedDate) : 'All Upcoming Events'}
          </span>
        </div>
        <button
          onClick={onAddEventClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          Add Event
        </button>
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="bg-muted/10 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground/50 mb-3 border border-border/30">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-muted-foreground/80 mb-1">No Events Scheduled</p>
            <p className="text-[10px] text-muted-foreground/50 max-w-[160px] leading-relaxed">
              Click Add Event to organize a session.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isCreator = event.creatorId === activeUserId
            return (
              <div 
                key={event.id}
                className="bg-muted/10 border border-border/30 rounded-xl p-3.5 hover:border-primary/20 transition relative flex flex-col group select-text"
              >
                {/* Event Time */}
                <div className="flex items-center text-[10px] text-primary font-bold gap-1.5 mb-2 leading-none">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                </div>

                {/* Event Title */}
                <h4 className="text-xs font-bold text-foreground mb-1 leading-snug break-words">
                  {event.title}
                </h4>

                {/* Event Description */}
                {event.description && (
                  <p className="text-[10px] text-muted-foreground leading-relaxed break-words mb-3">
                    {event.description}
                  </p>
                )}

                {/* Creator Avatar Info */}
                <div className="flex items-center gap-2 mt-auto border-t border-border/20 pt-2 shrink-0">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={event.creator?.imageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">
                      {event.creator?.fullName?.charAt(0).toUpperCase() || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-[9px] font-semibold text-muted-foreground leading-none">Created by</span>
                    <span className="text-[9px] font-bold text-foreground truncate leading-none mt-0.5">
                      {event.creator?.fullName || 'Member'}
                    </span>
                  </div>

                  {/* Delete Button (Visible on Hover if owner/creator) */}
                  {isCreator && (
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 hover:text-rose-500 text-muted-foreground transition cursor-pointer p-1 rounded-lg hover:bg-muted/60"
                      title="Delete Event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
