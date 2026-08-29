import type { InvoiceStatus } from '../types'

const CONFIG: Record<InvoiceStatus, { label: string; classes: string }> = {
  PENDING:   { label: 'Pendiente',    classes: 'bg-warning/10 text-warning border-warning/30' },
  PAID:      { label: 'Pagada',       classes: 'bg-accent/30 text-ink border-accent/50' },
  OVERDUE:   { label: 'Vencida',      classes: 'bg-danger/10 text-danger border-danger/30' },
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
