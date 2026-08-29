'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { History } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import Pagination from '@/shared/components/Pagination'
import WhatsAppButton from '@/shared/components/WhatsAppButton'
import { templates } from '@/shared/lib/whatsapp'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import RegisterPaymentDialog from './RegisterPaymentDialog'
import PaymentHistoryDialog from './PaymentHistoryDialog'
import { fetchInvoicesByStudent, fetchStudentBalance, cancelInvoice } from '../actions'
import type { InvoiceResponse, InvoiceStatus } from '../types'
import type { StudentResponse } from '@/features/students/types'
import type { PageResponse } from '@/shared/types/api'

const PAGE_SIZE = 12

const STATUS_FILTERS: { label: string; value: InvoiceStatus | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Vencida', value: 'OVERDUE' },
  { label: 'Parcial', value: 'PARTIAL' },
  { label: 'Pagada', value: 'PAID' },
  { label: 'Cancelada', value: 'CANCELLED' },
]

interface Props {
  students: StudentResponse[]
}

export default function InvoicesSection({ students }: Props) {
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [invoicesPage, setInvoicesPage] = useState<PageResponse<InvoiceResponse> | null>(null)
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<InvoiceResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<InvoiceResponse | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InvoiceResponse | null>(null)
  const [isCancelling, startCancelTransition] = useTransition()

  const filtered = students.filter((s) =>
    search.length < 2
      ? true
      : s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (!selectedStudentId) return
    setIsLoading(true)
    Promise.all([
      fetchInvoicesByStudent(selectedStudentId, page, PAGE_SIZE, filterStatus ?? undefined),
      fetchStudentBalance(selectedStudentId),
    ])
      .then(([inv, bal]) => {
        setInvoicesPage(inv)
        setBalance(bal)
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error cargando facturas'))
      .finally(() => setIsLoading(false))
  }, [selectedStudentId, page, filterStatus])

  function handleStudentSelect(id: number) {
    setSelectedStudentId(id)
    setPage(0)
    setFilterStatus(null)
    setSearch('')
  }

  function handleFilterStatus(s: InvoiceStatus | null) {
    setFilterStatus(s)
    setPage(0)
  }

  function handlePageChange(p: number) {
    setPage(p)
  }

  function handlePaid(updated: InvoiceResponse) {
    setInvoicesPage((prev) =>
      prev
        ? { ...prev, content: prev.content.map((inv) => (inv.id === updated.id ? updated : inv)) }
        : prev,
    )
    fetchStudentBalance(updated.studentId)
      .then(setBalance)
      .catch(() => null)
  }

  function handleCancel() {
    if (!cancelTarget) return
    startCancelTransition(async () => {
      try {
        const updated = await cancelInvoice(cancelTarget.id)
        setInvoicesPage((prev) =>
          prev
            ? { ...prev, content: prev.content.map((inv) => (inv.id === updated.id ? updated : inv)) }
            : prev,
        )
        toast.success('Factura cancelada')
        setCancelTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cancelar')
      }
    })
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const pendingBalance = balance !== null ? parseFloat(balance) : null
  const invoices = invoicesPage?.content ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Student selector */}
      <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
        <div className="p-4 border-b border-line">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alumno por nombre o código..."
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ghost focus:outline-none focus:ring-2 focus:ring-accent/70"
          />
        </div>
        {search.length >= 2 && (
          <div className="max-h-52 overflow-y-auto divide-y divide-line">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ghost">Sin resultados</p>
            ) : (
              filtered.slice(0, 20).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStudentSelect(s.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                    selectedStudentId === s.id
                      ? 'bg-muted-fill text-ink font-medium'
                      : 'text-prose hover:bg-surface'
                  }`}
                >
                  <span className="font-medium text-ink">{s.fullName}</span>
                  <span className="ml-2 text-ghost text-xs">{s.code}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected student info + invoices */}
      {selectedStudent && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{selectedStudent.fullName}</p>
              <p className="text-xs text-ghost mt-0.5">{selectedStudent.code}</p>
            </div>
            {pendingBalance !== null && (
              <div className="text-right">
                <p className="text-xs text-ghost">Saldo pendiente</p>
                <p className={`text-lg font-semibold ${pendingBalance > 0 ? 'text-danger' : 'text-ink'}`}>
                  S/ {pendingBalance.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleFilterStatus(value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  filterStatus === value
                    ? 'bg-ink text-white'
                    : 'bg-muted-fill text-prose hover:bg-white hover:shadow-card border border-transparent hover:border-line'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
              <p className="text-sm text-ghost">Cargando facturas...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
              <p className="text-sm text-ghost">
                {filterStatus ? `No hay facturas con estado "${STATUS_FILTERS.find(f => f.value === filterStatus)?.label}".` : 'No hay facturas para este alumno.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-surface">
                    <TableHead>N°</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-xs text-ghost font-mono">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-sm text-ink font-medium">{inv.concept}</TableCell>
                      <TableCell className="text-sm text-prose">S/ {inv.amount}</TableCell>
                      <TableCell className="text-sm text-ink">S/ {inv.paidAmount}</TableCell>
                      <TableCell className="text-sm text-danger">S/ {inv.pendingAmount}</TableCell>
                      <TableCell className="text-sm text-prose">{inv.dueDate}</TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setHistoryTarget(inv)}
                            className="p-1.5 rounded-lg text-ghost hover:text-ink hover:bg-muted-fill transition-colors duration-150"
                            title="Ver pagos"
                          >
                            <History size={14} />
                          </button>
                          {(inv.status === 'PENDING' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') && (
                            <button
                              onClick={() => setPaymentTarget(inv)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-ink text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                            >
                              Pagar
                            </button>
                          )}
                          {(inv.status === 'OVERDUE' || inv.status === 'PENDING') && selectedStudent?.guardianPhone && (
                            <WhatsAppButton
                              phone={selectedStudent.guardianPhone}
                              variant="icon"
                              label={`Recordar pago de ${inv.concept} por WhatsApp`}
                              text={templates.paymentReminder({
                                guardianName: selectedStudent.guardianName ?? '',
                                studentName: selectedStudent.fullName,
                                concept: inv.concept,
                                dueDate: inv.dueDate,
                                pendingAmount: inv.pendingAmount,
                                invoiceNumber: inv.invoiceNumber,
                              })}
                            />
                          )}
                          {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                            <button
                              onClick={() => setCancelTarget(inv)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-line text-ghost hover:text-danger hover:border-danger/30 transition-colors duration-150"
                            >
                              Anular
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {invoicesPage && (
                <div className="px-4 border-t border-line">
                  <Pagination
                    page={invoicesPage.page}
                    totalPages={invoicesPage.totalPages}
                    totalElements={invoicesPage.totalElements}
                    size={invoicesPage.size}
                    onPageChange={handlePageChange}
                    itemLabel="facturas"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <RegisterPaymentDialog
        invoice={paymentTarget}
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onPaid={handlePaid}
      />

      <PaymentHistoryDialog
        invoice={historyTarget}
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="¿Anular factura?"
        description={`Se anulará la factura ${cancelTarget?.invoiceNumber}. No se puede revertir.`}
        confirmLabel="Anular"
        danger
        loading={isCancelling}
      />
    </div>
  )
}
