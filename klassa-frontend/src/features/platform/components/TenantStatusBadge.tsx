import type { TenantStatus } from '../types'

const styles: Record<TenantStatus, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-accent/40 text-ink/80',
  SUSPENDED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-muted-fill text-prose',
}

const labels: Record<TenantStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
}

export default function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
