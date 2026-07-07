import type { InvoiceStatus } from '../types'

const CONFIG: Record<InvoiceStatus, { label: string; classes: string }> = {
  PENDING:   { label: 'Pendiente',    classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID:      { label: 'Pagada',       classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE:   { label: 'Vencida',      classes: 'bg-red-50 text-red-700 border-red-200' },
  PARTIAL:   { label: 'Parcial',      classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELLED: { label: 'Cancelada',    classes: 'bg-muted-fill text-ghost border-line' },
}

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, classes } = CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}
