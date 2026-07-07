'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerPayment } from '../actions'
import type { InvoiceResponse, PaymentMethod } from '../types'

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
]

const baseSchema = z.object({
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Monto inválido'),
  paymentDate: z.string().min(1, 'Requerido'),
  method: z.enum(['CASH', 'TRANSFER', 'CARD', 'YAPE', 'PLIN']),
  receiptNumber: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof baseSchema>

interface Props {
  invoice: InvoiceResponse | null
  open: boolean
  onClose: () => void
  onPaid: (updated: InvoiceResponse) => void
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RegisterPaymentDialog({ invoice, open, onClose, onPaid }: Props) {
  const [isPending, startTransition] = useTransition()
  const today = localToday()
  const maxAmountRef = useRef<number>(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { amount: '', paymentDate: today, method: 'CASH', receiptNumber: '', notes: '' },
    mode: 'onTouched',
  })

  useEffect(() => {
    if (invoice) {
      maxAmountRef.current = parseFloat(invoice.pendingAmount)
      form.reset({
        amount: invoice.pendingAmount,
        paymentDate: today,
        method: 'CASH',
        receiptNumber: '',
        notes: '',
      })
    }
  }, [invoice]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (isPending) return
    onClose()
    form.reset({ amount: '', paymentDate: today, method: 'CASH', receiptNumber: '', notes: '' })
  }

  function onSubmit(values: FormValues) {
    if (!invoice) return
    const amount = parseFloat(values.amount)
    if (amount > maxAmountRef.current) {
      form.setError('amount', {
        message: `No puede superar el saldo pendiente (S/ ${maxAmountRef.current.toFixed(2)})`,
      })
      return
    }
    startTransition(async () => {
      try {
        const updated = await registerPayment({
          invoiceId: invoice.id,
          amount,
          paymentDate: values.paymentDate,
          method: values.method,
          receiptNumber: values.receiptNumber,
          notes: values.notes,
        })
        toast.success('Pago registrado')
        onPaid(updated)
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al registrar pago')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Registrar pago"
      description={invoice ? `${invoice.concept} — ${invoice.invoiceNumber}` : undefined}
      className="max-w-sm"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto (S/)
                  {invoice && (
                    <span className="ml-1 text-ghost font-normal">máx. {invoice.pendingAmount}</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxAmountRef.current || undefined}
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="paymentDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <input type="date" {...field} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="method" render={({ field }) => (
            <FormItem>
              <FormLabel>Método</FormLabel>
              <FormControl>
                <select {...field} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="receiptNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>N° recibo <span className="text-ghost font-normal">(opcional)</span></FormLabel>
              <FormControl><Input placeholder="REC-001" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Registrando...' : 'Registrar pago'}</Button>
          </div>
        </form>
      </Form>
    </Dialog>
  )
}
