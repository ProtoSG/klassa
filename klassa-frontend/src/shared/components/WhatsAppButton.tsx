'use client'

import { toast } from 'sonner'
import { openWhatsAppMessage } from '@/shared/lib/whatsapp'

interface Props {
  phone: string | null | undefined
  text: string
  /** Optional accessible label override (defaults to "Enviar WhatsApp"). */
  label?: string
  /**
   * Visual variant:
   * - "icon"  → compact icon-only button (table rows, side-by-side with other actions)
   * - "full"  → labeled button with icon (cards, primary CTA spots)
   */
  variant?: 'icon' | 'full'
  className?: string
}

/**
 * Tiny button that opens WhatsApp Web / app with a pre-filled message. The user
 * still has to press Send — that's the cost of avoiding the WhatsApp Business
 * API integration. Renders as `null` (no button) when the phone is unparseable
 * so callers can drop it in unconditionally without checking.
 */
export default function WhatsAppButton({
  phone,
  text,
  label = 'Enviar WhatsApp',
  variant = 'icon',
  className = '',
}: Props) {
  function handleClick() {
    try {
      openWhatsAppMessage({ phone, text })
    } catch (e) {
      // Most common cause: empty/unparseable phone. Caller should have hidden the button
      // already, but if it slipped through, show the user a clear reason instead of
      // opening a blank WhatsApp share sheet.
      toast.error(e instanceof Error ? e.message : 'No se pudo abrir WhatsApp')
    }
  }

  if (!phone) return null

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ${className}`}
        title={label}
      >
        <WhatsAppIcon size={14} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-1.5 rounded-lg text-ghost hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors duration-150 ${className}`}
      title={label}
      aria-label={label}
    >
      <WhatsAppIcon size={14} />
    </button>
  )
}

/**
 * Inline WhatsApp glyph — lucide-react ships a generic `MessageCircle` but no
 * real WhatsApp icon, so we draw the speech-bubble-with-phone shape ourselves.
 * Single path keeps it lightweight and matches the brand color when tinted.
 */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}
