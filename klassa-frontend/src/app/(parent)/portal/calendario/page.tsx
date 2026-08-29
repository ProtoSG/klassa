import { getCalendarEvents } from '@/features/calendar-events/api'
import CalendarPageClient from '@/features/calendar-events/components/CalendarPageClient'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function ParentCalendarioPage() {
  const events = await getCalendarEvents()
    .catch((err) => { logFetchError('parent-portal-calendario', err); return null })

  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto flex flex-col gap-4 pt-6">
      <div>
        <h1 className="text-xl font-medium text-ink">Calendario</h1>
        <p className="text-prose text-sm mt-0.5">Eventos y actividades del colegio</p>
      </div>

      {events ? (
        <CalendarPageClient events={events} canManage={false} />
      ) : (
        <ErrorState message="Error al cargar el calendario." />
      )}
    </div>
  )
}
