import type { TenantStatus } from './types'

export type TenantStatusAction = {
  label: string
  next: TenantStatus
  danger: boolean
  irreversible?: boolean
}

const CANCEL: TenantStatusAction = { label: 'Cancelar', next: 'CANCELLED', danger: true, irreversible: true }

export function getTenantStatusActions(status: TenantStatus): TenantStatusAction[] {
  if (status === 'ACTIVE') return [{ label: 'Suspender', next: 'SUSPENDED', danger: true }, CANCEL]
  if (status === 'TRIAL') return [
    { label: 'Activar', next: 'ACTIVE', danger: false },
    { label: 'Suspender', next: 'SUSPENDED', danger: true },
    CANCEL,
  ]
  if (status === 'SUSPENDED') return [{ label: 'Activar', next: 'ACTIVE', danger: false }, CANCEL]
  return []
}
