'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { openWhatsAppMessage, templates } from '@/shared/lib/whatsapp'
import { fetchFamiliesForAnnouncement } from '../actions'
import type { CalendarEvent } from '../types'

interface Props {
  event: CalendarEvent
}

/**
 * Mass-announce a calendar event via WhatsApp. Pulls every active student's family
 * (deduped by familyId so siblings only get one message), then opens a WhatsApp Web
 * tab per unique family phone with a small inter-tab delay so the browser's
 * popup blocker doesn't eat all but the first one.
 *
 * <p>The data fetch happens in a Server Action (`fetchFamiliesForAnnouncement`) because
 * it depends on `cookies()` via tenantFetch — a Client Component can't do that
 * transitively in Next 16 without hitting the "next/headers in Pages Router" guard.
 *
 * <p>Manual send per family — same trade-off as the rest of the WhatsApp integration.
 * The user can edit the message in WhatsApp before pressing Send on each chat.
 */
export default function AnnounceEventButton({ event }: Props) {
  const [open, setOpen] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function fetchCountAndOpen() {
    startTransition(async () => {
      try {
        const families = await fetchFamiliesForAnnouncement()
        if (families.length === 0) {
          toast.error('Ninguna familia tiene teléfono registrado todavía.')
          return
        }
        setPreviewCount(families.length)
        setOpen(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo cargar las familias')
      }
    })
  }

  function handleConfirm() {
    startTransition(async () => {
      try {
        const families = await fetchFamiliesForAnnouncement()
        const message = templates.announcementMessage({
          eventTitle: event.title,
          eventType: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          description: event.description,
        })
        // Open with a small delay so the browser doesn't block all but the first tab.
        // Browsers vary on the exact limit (Chrome ~20, Firefox ~~9) but the per-family
        // send is still a manual step, so 150ms stagger is plenty.
        for (let i = 0; i < families.length; i++) {
          const family = families[i]
          setTimeout(() => {
            try {
              openWhatsAppMessage({ phone: family.phone, text: message })
            } catch {
              // Individual phone failures are non-fatal — the toast at the end tells the
              // director to retry manually for any tabs that didn't open.
            }
          }, i * 150)
        }
        toast.success(`Abriendo ${families.length} chats de WhatsApp. Presioná Enviar en cada uno.`)
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo anunciar el evento')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={fetchCountAndOpen}
        className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
      >
        <Send size={12} />
        Anunciar por WhatsApp
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="¿Anunciar este evento por WhatsApp?"
        description={
          previewCount !== null
            ? `Se abrirá un chat de WhatsApp con cada una de las ${previewCount} familias con alumnos activos. Tendrás que presionar Enviar en cada uno.`
            : 'Cargando familias…'
        }
        confirmLabel="Anunciar"
        loading={isPending}
      />
    </>
  )
}
