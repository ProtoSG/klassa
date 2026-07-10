'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MonthGrid from './MonthGrid'
import DayEventsDialog from './DayEventsDialog'
import NewCalendarEventDialog from './NewCalendarEventDialog'
import type { CalendarEvent } from '../types'

interface Props {
  events: CalendarEvent[]
  canManage: boolean
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function CalendarPageClient({ events: initialEvents, canManage }: Props) {
  const [events, setEvents] = useState(initialEvents)
  useEffect(() => setEvents(initialEvents), [initialEvents])

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function handleCreated(event: CalendarEvent) {
    setEvents((prev) => [...prev, event])
  }

  function handleUpdated(updated: CalendarEvent) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function handleDeleted(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const monthLabel = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(month)
  const selectedEvents = selectedDate
    ? events.filter((e) => selectedDate >= e.startDate && selectedDate <= e.endDate)
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            aria-label="Mes anterior"
            className="p-2 rounded-xl border border-line bg-white text-prose hover:text-ink hover:border-ink/20 transition-all duration-200"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-medium text-ink capitalize w-40 text-center">{monthLabel}</h2>
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
            className="p-2 rounded-xl border border-line bg-white text-prose hover:text-ink hover:border-ink/20 transition-all duration-200"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="px-3 py-2 rounded-xl border border-line bg-white text-sm text-prose hover:text-ink hover:border-ink/20 transition-all duration-200"
          >
            Hoy
          </button>
        </div>
        {canManage && <NewCalendarEventDialog onCreated={handleCreated} />}
      </div>

      <MonthGrid month={month} events={events} onDayClick={setSelectedDate} />

      <DayEventsDialog
        date={selectedDate}
        events={selectedEvents}
        canManage={canManage}
        onClose={() => setSelectedDate(null)}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
