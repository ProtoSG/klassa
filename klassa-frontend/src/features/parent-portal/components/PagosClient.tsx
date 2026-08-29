'use client'

import { useEffectiveChildId } from '../hooks/useEffectiveChildId'
import ChildPickerBar from './ChildPickerBar'
import InvoiceStatusBadge from '@/features/billing/components/InvoiceStatusBadge'
import type { StudentResponse } from '@/features/students/types'
import type { InvoiceResponse } from '@/features/billing/types'

export interface ChildInvoices {
  student: StudentResponse
  invoices: InvoiceResponse[]
  balance: string | null
}

export default function PagosClient({ data }: { data: ChildInvoices[] }) {
  const effectiveId = useEffectiveChildId(data.map((d) => d.student.id))
  const current = data.find((d) => d.student.id === effectiveId)

  if (!current) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <p className="text-sm text-prose">No hay alumnos registrados en tu familia.</p>
      </div>
    )
  }

  const sorted = [...current.invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  return (
    <div className="flex flex-col gap-3">
      <ChildPickerBar data={data} currentId={current.student.id} />

      {current.balance !== null && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex items-center justify-between">
          <p className="text-xs text-ghost">Saldo pendiente</p>
          <span className="text-2xl font-medium text-ink">S/ {current.balance}</span>
        </div>
      )}

      <div className="rounded-xl border border-line bg-white/60 px-4 py-2.5">
        <p className="text-xs text-prose">
          El pago se realiza en el colegio o por transferencia. Todavía no hay pago en línea.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-prose">No hay comprobantes registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sorted.map((invoice) => (
            <div key={invoice.id} className="rounded-2xl border border-line bg-white p-4 shadow-card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{invoice.concept}</p>
                  <p className="text-xs text-ghost mt-0.5">Vence {invoice.dueDate}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-prose">S/ {invoice.amount}</span>
                {parseFloat(invoice.pendingAmount) > 0 && (
                  <span className="text-danger font-medium">Pendiente S/ {invoice.pendingAmount}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
