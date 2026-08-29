'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Search, MoreVertical } from 'lucide-react'
import { updateTenantStatus } from '../actions'
import TenantStatusBadge from './TenantStatusBadge'
import type { TenantResponse, TenantStatus } from '../types'
import { getTenantStatusActions } from '../statusActions'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_FILTERS: { label: string; value: TenantStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Activos', value: 'ACTIVE' },
  { label: 'Suspendidos', value: 'SUSPENDED' },
  { label: 'Cancelados', value: 'CANCELLED' },
]

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

function StatusActions({
  tenant,
  onRequest,
}: {
  tenant: TenantResponse
  onRequest: (action: PendingAction) => void
}) {
  const actions = getTenantStatusActions(tenant.status)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!actions.length) return <span className="text-ghost text-xs">—</span>

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label="Acciones"
        aria-expanded={open}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-ghost hover:bg-surface hover:text-ink transition-colors duration-150"
      >
        <MoreVertical size={15} />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-50 min-w-[140px] rounded-xl border border-line bg-white shadow-hover p-1 flex flex-col animate-dialog-in"
        >
          {actions.map(({ label, next, danger, irreversible }) => (
            <button
              key={next}
              onClick={() => {
                onRequest({ tenant, label, next, danger, irreversible })
                setOpen(false)
              }}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors duration-150 ${
                danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

export default function TenantTable({ tenants }: { tenants: TenantResponse[] }) {
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL')

  function handleConfirm() {
    if (!pending) return
    startTransition(async () => {
      await updateTenantStatus(pending.tenant.subdomain, pending.next)
      setPending(null)
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tenants.filter((t) => {
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [tenants, query, statusFilter])

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o subdominio"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent transition-all duration-200"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                statusFilter === f.value
                  ? 'bg-ink text-white'
                  : 'bg-white border border-line text-prose hover:bg-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-prose py-8">
                  Ningún colegio coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((tenant) => (
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
    </div>
  )
}
