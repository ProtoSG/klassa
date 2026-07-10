import { calendarEventTypeDotColor } from './CalendarEventTypeBadge'
import type { CalendarEvent } from '../types'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface Props {
  month: Date
  events: CalendarEvent[]
  onDayClick: (dateStr: string) => void
}

function toISODate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

export default function MonthGrid({ month, events, onDayClick }: Props) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const today = toISODate(new Date())

  const firstOfMonth = new Date(year, monthIndex, 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, monthIndex, 1 - mondayOffset)

  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    return date
  })

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2.5 text-center text-xs font-medium text-ghost">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const dateStr = toISODate(date)
          const inMonth = date.getMonth() === monthIndex
          const isToday = dateStr === today
          const dayEvents = events.filter((e) => dateStr >= e.startDate && dateStr <= e.endDate)
          const dotColors = [...new Set(dayEvents.map((e) => calendarEventTypeDotColor(e.type)))].slice(0, 3)

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`flex flex-col items-center gap-1 border-b border-r border-line last:border-r-0 py-2.5 min-h-16 hover:bg-surface transition-colors duration-150 ${
                inMonth ? '' : 'opacity-40'
              }`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-ink text-white' : 'text-ink'
                }`}
              >
                {date.getDate()}
              </span>
              {dotColors.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {dotColors.map((color, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
