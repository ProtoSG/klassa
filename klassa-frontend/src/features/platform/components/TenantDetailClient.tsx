'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import TenantStatusBadge from './TenantStatusBadge'
import { updateTenantStatus, updateTenantPlan } from '../actions'
import { getTenantStatusActions, type TenantStatusAction } from '../statusActions'
import type { TenantResponse, Plan } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  tenant: TenantResponse
  plans: Plan[]
}

export default function TenantDetailClient({ tenant: initial, plans }: Props) {
  const [tenant, setTenant] = useState(initial)
  const [pending, setPending] = useState<TenantStatusAction | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState(initial.planId)
  const [isStatusPending, startStatusTransition] = useTransition()
  const [isPlanPending, startPlanTransition] = useTransition()

  const actions = getTenantStatusActions(tenant.status)
  const planChanged = selectedPlanId !== tenant.planId

  function handleStatusConfirm() {
    if (!pending) return
    startStatusTransition(async () => {
      try {
        const updated = await updateTenantStatus(tenant.subdomain, pending.next)
        setTenant(updated)
        setSelectedPlanId(updated.planId)
        toast.success(`Estado actualizado a ${pending.label.toLowerCase()}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al actualizar estado')
      } finally {
        setPending(null)
      }
    })
  }

  function handlePlanChange() {
    startPlanTransition(async () => {
      try {
        const updated = await updateTenantPlan(tenant.subdomain, selectedPlanId)
        setTenant(updated)
        setSelectedPlanId(updated.planId)
        toast.success('Plan actualizado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cambiar el plan')
      }
    })
  }

  return (
    <>
      {/* Status + actions */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-prose">Estado</h2>
          <TenantStatusBadge status={tenant.status} />
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2 pt-1 border-t border-line">
            {actions.map((action) => (
              <button
                key={action.next}
                onClick={() => setPending(action)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  action.danger
                    ? 'bg-danger/10 text-danger hover:bg-danger/20'
                    : 'bg-ink text-white hover:scale-[1.02] active:scale-[0.98] shadow-card'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Plan */}
      {plans.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
          <h2 className="text-sm font-medium text-prose">Plan</h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              disabled={isPlanPending}
              className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70 disabled:opacity-60"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — hasta {p.maxStudents.toLocaleString()} alumnos
                </option>
              ))}
            </select>
            <button
              onClick={handlePlanChange}
              disabled={!planChanged || isPlanPending}
              className="px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-card disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isPlanPending ? 'Guardando...' : 'Cambiar plan'}
            </button>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard
          label="Trial hasta"
          value={tenant.trialEndsAt ? formatDate(tenant.trialEndsAt) : '—'}
        />
        <InfoCard label="Creado" value={formatDate(tenant.createdAt)} />
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleStatusConfirm}
        title={pending ? `${pending.label} colegio` : ''}
        description={
          pending?.irreversible
            ? `Esta acción cancelará "${tenant.name}" de forma permanente. No se puede deshacer.`
            : pending?.danger
              ? `"${tenant.name}" perderá acceso hasta ser reactivado.`
              : `Se habilitará el acceso completo para "${tenant.name}".`
        }
        confirmLabel={pending?.label}
        danger={pending?.danger ?? false}
        loading={isStatusPending}
      />
    </>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <p className="text-xs font-medium text-ghost">{label}</p>
      <p className="mt-1.5 text-base font-medium text-ink">{value}</p>
    </div>
  )
}
