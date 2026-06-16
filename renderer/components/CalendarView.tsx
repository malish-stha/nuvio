import React from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { pusherClient } from '../lib/pusher-client'
import { isClerkConfigured } from '../lib/clerk-fallback'
import { CalendarGrid } from './CalendarGrid'
import { EventList } from './EventList'
import { EventModal } from './EventModal'

interface CalendarViewProps {
  serverId: string
  activeUserId: string | null | undefined
  getToken: () => Promise<string | null>
}

export const CalendarView = ({
  serverId,
  activeUserId,
  getToken
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date())
  const [events, setEvents] = React.useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Fetch initial events list
  const fetchEvents = React.useCallback(async () => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/events?serverId=${serverId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }, [serverId, getToken])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Pusher subscriptions for server calendar updates
  React.useEffect(() => {
    if (!pusherClient || !serverId) return

    const channel = pusherClient.subscribe(`server-${serverId}`)

    channel.bind('event-created', (newEvent: any) => {
      setEvents(prev => {
        if (prev.some(e => e.id === newEvent.id)) return prev
        return [...prev, newEvent].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      })
    })

    channel.bind('event-deleted', ({ eventId }: { eventId: string }) => {
      setEvents(prev => prev.filter(e => e.id !== eventId))
    })

    return () => {
      channel.unbind('event-created')
      channel.unbind('event-deleted')
      pusherClient.unsubscribe(`server-${serverId}`)
    }
  }, [serverId])

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleGoToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleAddEvent = async (data: { title: string; description: string; startTime: string; endTime: string }) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serverId,
          ...data
        })
      })
      if (res.ok) {
        const newEvent = await res.json()
        setEvents(prev => {
          if (prev.some(e => e.id === newEvent.id)) return prev
          return [...prev, newEvent].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        })
      }
    } catch (err) {
      console.error('Failed to create calendar event:', err)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/events?eventId=${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      }
    } catch (err) {
      console.error('Failed to delete calendar event:', err)
    }
  }

  const formatMonthLabel = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col bg-muted/10 overflow-hidden select-none">
      {/* Calendar Header Panel */}
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Server Calendar</h2>
        </div>

        {/* Month Selector Navigation */}
        <div className="flex items-center gap-4 bg-muted/10 border border-border/40 rounded-xl px-2 py-1 select-none">
          <button
            onClick={handlePrevMonth}
            className="hover:text-primary hover:bg-muted/40 p-1.5 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-foreground min-w-[120px] text-center font-mono">
            {formatMonthLabel(currentDate)}
          </span>
          <button
            onClick={handleNextMonth}
            className="hover:text-primary hover:bg-muted/40 p-1.5 rounded-lg transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleGoToToday}
          className="bg-card hover:bg-muted/40 border border-border/40 text-foreground px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Main Container View (Grid & Sidebar List) */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <EventList
          events={events}
          selectedDate={selectedDate}
          activeUserId={activeUserId}
          onDeleteEvent={handleDeleteEvent}
          onAddEventClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Modal Dialog */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  )
}
