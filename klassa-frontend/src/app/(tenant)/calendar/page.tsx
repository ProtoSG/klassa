import { getCalendarEvents } from '@/features/calendar-events/api'
import CalendarPageClient from '@/features/calendar-events/components/CalendarPageClient'
import { getMe } from '@/features/auth/actions'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function CalendarPage() {
  const session = await getMe()
  const canManage = session?.user.role === 'ADMIN'
  const events = await getCalendarEvents().catch((err) => { logFetchError('calendar-events', err); return null })

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-medium text-ink">Calendario</h1>
        <p className="text-prose text-sm mt-0.5">Eventos y actividades del colegio</p>
      </div>

      {events ? (
        <CalendarPageClient events={events} canManage={canManage} />
      ) : (
        <ErrorState message="Error al cargar el calendario." />
      )}
    </div>
  )
}
