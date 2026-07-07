'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateTenantStatus } from '../actions'
import TenantStatusBadge from './TenantStatusBadge'
import type { TenantResponse, TenantStatus } from '../types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type PendingAction = {
  tenant: TenantResponse
  label: string
  next: TenantStatus
  danger: boolean
  irreversible?: boolean
}

type ActionDef = { label: string; next: TenantStatus; danger: boolean; irreversible?: boolean }

function getStatusActions(status: TenantStatus): ActionDef[] {
  const cancel: ActionDef = { label: 'Cancelar', next: 'CANCELLED', danger: true, irreversible: true }
  if (status === 'ACTIVE') return [{ label: 'Suspender', next: 'SUSPENDED', danger: true }, cancel]
  if (status === 'TRIAL') return [
    { label: 'Activar', next: 'ACTIVE', danger: false },
    { label: 'Suspender', next: 'SUSPENDED', danger: true },
    cancel,
  ]
  if (status === 'SUSPENDED') return [{ label: 'Activar', next: 'ACTIVE', danger: false }, cancel]
  return []
}

function StatusActions({
  tenant,
  onRequest,
}: {
  tenant: TenantResponse
  onRequest: (action: PendingAction) => void
}) {
  const actions = getStatusActions(tenant.status)

  if (!actions.length) return <span className="text-ghost text-xs">—</span>

  return (
    <div className="flex gap-2">
      {actions.map(({ label, next, danger, irreversible }) => (
        <button
          key={next}
          onClick={() => onRequest({ tenant, label, next, danger, irreversible })}
          className={`text-xs underline-offset-2 hover:underline transition-colors ${
            danger ? 'text-red-500 hover:text-red-600' : 'text-ink/60 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function TenantTable({ tenants }: { tenants: TenantResponse[] }) {
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!pending) return
    startTransition(async () => {
      await updateTenantStatus(pending.tenant.subdomain, pending.next)
      setPending(null)
    })
  }

  if (!tenants.length) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center text-prose shadow-card">
        No hay colegios registrados aún.
      </div>
    )
  }

  const dialogDesc = pending?.irreversible
    ? `Esta acción cancelará "${pending.tenant.name}" de forma permanente. No se puede deshacer.`
    : pending?.danger
      ? `"${pending.tenant.name}" perderá acceso. Podrás reactivarlo después.`
      : `Se habilitará el acceso completo para "${pending?.tenant.name}".`

  return (
    <>
      <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-surface">
              <TableHead>Nombre</TableHead>
              <TableHead>Subdominio</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Trial hasta</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <Link
                    href={`/platform/tenants/${tenant.subdomain}`}
                    className="font-medium text-ink hover:underline underline-offset-2"
                  >
                    {tenant.name}
                  </Link>
                </TableCell>
                <TableCell className="text-prose font-mono text-xs">
                  {tenant.subdomain}
                </TableCell>
                <TableCell className="text-prose">{tenant.planName}</TableCell>
                <TableCell>
                  <TenantStatusBadge status={tenant.status} />
                </TableCell>
                <TableCell className="text-prose text-xs">
                  {tenant.trialEndsAt ? formatDate(tenant.trialEndsAt) : '—'}
                </TableCell>
                <TableCell className="text-prose text-xs">
                  {formatDate(tenant.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusActions tenant={tenant} onRequest={setPending} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={pending ? `${pending.label} colegio` : ''}
        description={pending ? dialogDesc : undefined}
        confirmLabel={pending?.label}
        danger={pending?.danger ?? false}
        loading={isPending}
      />
    </>
  )
}
