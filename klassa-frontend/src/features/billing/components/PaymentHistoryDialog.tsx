'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import { fetchPaymentsByInvoice } from '../actions'
import type { InvoiceResponse, PaymentMethod, PaymentResponse } from '../types'

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  YAPE: 'Yape',
  PLIN: 'Plin',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  invoice: InvoiceResponse | null
  open: boolean
  onClose: () => void
}

export default function PaymentHistoryDialog({ invoice, open, onClose }: Props) {
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && invoice) {
      setIsLoading(true)
      fetchPaymentsByInvoice(invoice.id)
        .then(setPayments)
        .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error cargando pagos'))
        .finally(() => setIsLoading(false))
    } else {
      setPayments([])
    }
  }, [open, invoice])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Pagos — ${invoice?.invoiceNumber ?? ''}`}
      description={invoice?.concept}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {/* Invoice summary */}
        {invoice && (
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-surface p-4">
            <div>
              <p className="text-xs text-ghost">Total</p>
              <p className="text-sm font-medium text-ink mt-0.5">S/ {invoice.amount}</p>
            </div>
            <div>
              <p className="text-xs text-ghost">Pagado</p>
              <p className="text-sm font-medium text-emerald-600 mt-0.5">S/ {invoice.paidAmount}</p>
            </div>
            <div>
              <p className="text-xs text-ghost">Pendiente</p>
              <p className={`text-sm font-medium mt-0.5 ${parseFloat(invoice.pendingAmount) > 0 ? 'text-red-600' : 'text-prose'}`}>
                S/ {invoice.pendingAmount}
              </p>
            </div>
            <div>
              <p className="text-xs text-ghost">Estado</p>
              <div className="mt-0.5"><InvoiceStatusBadge status={invoice.status} /></div>
            </div>
          </div>
        )}

        {/* Payment list */}
        {isLoading ? (
          <p className="text-sm text-ghost py-6 text-center">Cargando pagos...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-ghost py-6 text-center">No hay pagos registrados para esta factura.</p>
        ) : (
          <div className="rounded-xl border border-line overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-surface">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>N° Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-prose">{fmtDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-sm font-medium text-emerald-600">S/ {p.amount}</TableCell>
                    <TableCell className="text-sm text-prose">{METHOD_LABEL[p.method]}</TableCell>
                    <TableCell className="text-xs text-ghost font-mono">
                      {p.receiptNumber ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Totals row when multiple payments */}
        {payments.length > 1 && (
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-ghost">{payments.length} pagos registrados</p>
            <p className="text-sm font-medium text-ink">
              Total pagado:{' '}
              <span className="text-emerald-600">
                S/ {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </div>
    </Dialog>
  )
}
