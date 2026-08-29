/**
 * Tiny WhatsApp Web deep-link helper. Opens `https://wa.me/<intl-phone>?text=<encoded>`
 * which pre-selects the chat in WhatsApp Web / mobile app with the message ready to send.
 *
 * <p>No Meta Business, no API keys, no per-message fees, no template pre-approval.
 * The user (school staff) always has to click Send — that's the trade-off vs the full
 * WhatsApp Business API. For Klassa's scale (<= 50 tenants, low message volume) this is
 * the right MVP, and the message templates here are exactly the ones the future API
 * integration would reuse, only the transport changes.
 */

/**
 * Normalizes a phone number to the format WhatsApp Web expects: digits only,
 * no '+', no spaces, no dashes. Strips a leading '00' international prefix
 * in case some PBX systems store the country code that way.
 *
 * Returns null if no usable digits remain — callers should treat that as
 * "no phone, don't show the button".
 *
 * Examples:
 *   normalizePhone('+51 987 654 321')  → '51987654321'
 *   normalizePhone('987654321')        → '51987654321'  (assumes Peru if no country code; callers should pass the explicit country)
 *   normalizePhone('00 51 987 654 321')→ '51987654321'
 *   normalizePhone('')                  → null
 */
export function normalizePhone(phone: string | null | undefined, countryCode = '51'): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  // Drop leading 00 (international access prefix)
  const stripped = digits.startsWith('00') ? digits.slice(2) : digits
  // If already has country code (long enough for any reasonable country), use as-is
  if (stripped.length >= 11) return stripped
  // Otherwise prepend the default country code (Peru by default — Klassa's primary market)
  return countryCode + stripped
}

interface OpenArgs {
  phone: string | null | undefined
  text: string
  /** Override the country code used by normalizePhone when the local number has no prefix. */
  countryCode?: string
}

/**
 * Open WhatsApp Web / app with the chat pre-selected and message pre-filled.
 * The user still has to click Send — that's the cost of skipping the
 * WhatsApp Business API. If the phone is unparseable, throws so the caller
 * can disable the button rather than silently opening wa.me with an empty
 * target (which is just a generic share sheet).
 */
export function openWhatsAppMessage({ phone, text, countryCode }: OpenArgs): void {
  const normalized = normalizePhone(phone, countryCode)
  if (!normalized) {
    throw new Error('Número de teléfono inválido o vacío')
  }
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
  // window.open with _blank + noopener; the URL itself is a deep link, so even
  // if the popup is blocked, the user's browser may still navigate via the link.
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─── Templates ───────────────────────────────────────────────────────────────
// Keep templates as pure functions so callers can preview AND open the same
// string — never let the preview drift from what gets sent. Each takes only
// the data it actually uses; missing data falls back to neutral phrasing
// instead of leaking a "{undefined}" into a real WhatsApp chat.

export const templates = {
  attendanceAlert(args: {
    guardianName: string
    studentName: string
    sectionName?: string
    date?: string
    absentDays?: number
  }): string {
    const greeting = args.guardianName ? `Hola ${args.guardianName},` : 'Hola,'
    const student = args.studentName
    const section = args.sectionName ? ` de ${args.sectionName}` : ''
    const date = args.date ? ` el ${args.date}` : ''
    const tail = args.absentDays && args.absentDays > 1
      ? ` Lleva ${args.absentDays} días ausente esta semana.`
      : ''
    return [
      `${greeting}`,
      `Le escribo del colegio. ${student}${section} figura como ausente${date}.${tail}`,
      `¿Podría confirmarnos si se encuentra bien y cuándo se reincorpora?`,
      '',
      `Gracias.`,
    ].join('\n')
  },

  paymentReminder(args: {
    guardianName: string
    studentName: string
    concept: string
    dueDate: string
    pendingAmount: string
    invoiceNumber?: string
  }): string {
    const greeting = args.guardianName ? `Hola ${args.guardianName},` : 'Hola,'
    const ref = args.invoiceNumber ? ` (${args.invoiceNumber})` : ''
    return [
      `${greeting}`,
      `Le recuerdo que la pensión de ${args.studentName}${ref} por "${args.concept}"`,
      `vence el ${args.dueDate}. Saldo pendiente: S/ ${args.pendingAmount}.`,
      '',
      `Si ya realizó el pago, por favor ignore este mensaje.`,
      `Gracias.`,
    ].join('\n')
  },

  genericMessage(args: {
    guardianName?: string
    studentName?: string
    body: string
  }): string {
    const greeting = args.guardianName ? `Hola ${args.guardianName},` : 'Hola,'
    const ref = args.studentName ? ` sobre ${args.studentName}` : ''
    return `${greeting}\nLe escribo del colegio${ref}.\n\n${args.body}\n\nGracias.`
  },

  /**
   * Mass announcement for a calendar event. The greeting is intentionally generic
   * ("Estimada familia") rather than personal — schools sending an event-wide
   * notice shouldn't pretend they wrote it individually to each parent.
   */
  announcementMessage(args: {
    eventTitle: string
    eventType: string
    startDate: string
    endDate?: string
    description?: string | null
    schoolName?: string
  }): string {
    const school = args.schoolName ?? 'el colegio'
    const dateRange = args.endDate && args.endDate !== args.startDate
      ? `del ${args.startDate} al ${args.endDate}`
      : `el ${args.startDate}`
    const desc = args.description ? `\n\n${args.description}` : ''
    return [
      `Estimada familia,`,
      `Les informamos sobre el siguiente evento del calendario de ${school}:`,
      ``,
      `📅 ${args.eventTitle} (${args.eventType})`,
      `Fecha: ${dateRange}${desc}`,
      ``,
      `Gracias.`,
    ].join('\n')
  },
} as const
