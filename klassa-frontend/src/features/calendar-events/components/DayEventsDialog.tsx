'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Dialog } from '@/shared/components/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import CalendarEventTypeBadge from './CalendarEventTypeBadge'
import EditCalendarEventDialog from './EditCalendarEventDialog'
import NewCalendarEventDialog from './NewCalendarEventDialog'
import AnnounceEventButton from './AnnounceEventButton'
import { deleteCalendarEvent } from '../actions'
import type { CalendarEvent } from '../types'

interface Props {
  date: string | null
  events: CalendarEvent[]
  canManage: boolean
  onClose: () => void
  onCreated: (event: CalendarEvent) => void
  onUpdated: (event: CalendarEvent) => void
  onDeleted: (id: number) => void
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function DayEventsDialog({ date, events, canManage, onClose, onCreated, onUpdated, onDeleted }: Props) {
  const [removeTarget, setRemoveTarget] = useState<CalendarEvent | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    if (!removeTarget) return
    startTransition(async () => {
      try {
        await deleteCalendarEvent(removeTarget.id)
        onDeleted(removeTarget.id)
        toast.success('Evento eliminado')
        setRemoveTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar el evento')
      }
    })
  }

  return (
    <>
      <Dialog
        open={!!date}
        onClose={onClose}
        title={date ? fmtDate(date) : ''}
        className="max-w-sm"
      >
        <div className="flex flex-col gap-3">
          {events.length === 0 ? (
            <p className="text-sm text-ghost">Sin eventos este día.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-xl border border-line p-3 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{event.title}</p>
                  {canManage && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <EditCalendarEventDialog event={event} onUpdated={onUpdated} />
                      <button
                        onClick={() => setRemoveTarget(event)}
                        aria-label="Eliminar evento"
                        className="p-1.5 rounded-lg text-ghost hover:text-danger hover:bg-danger/10 transition-colors duration-150"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <CalendarEventTypeBadge type={event.type} />
                {event.description && (
                  <p className="text-xs text-prose">{event.description}</p>
                )}
                <AnnounceEventButton event={event} />
              </div>
            ))
          )}

          {canManage && date && (
            <NewCalendarEventDialog
              defaultDate={date}
              onCreated={onCreated}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="text-sm font-medium text-ink hover:underline underline-offset-2 text-left"
                >
                  + Nuevo evento
                </button>
              )}
            />
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="¿Eliminar evento?"
        description={`"${removeTarget?.title}" se eliminará permanentemente.`}
        confirmLabel="Eliminar"
        danger
        loading={isPending}
      />
    </>
  )
}
