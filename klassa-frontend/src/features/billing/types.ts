export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'YAPE' | 'PLIN'

export interface FeeScheduleResponse {
  id: number
  concept: string
  amount: string
  dueDay: number
  academicYearId: number
  academicYearName: string
  active: boolean
}

export interface InvoiceResponse {
  id: number
  invoiceNumber: string
  studentId: number
  studentName: string
  feeScheduleId: number
  concept: string
  amount: string
  paidAmount: string
  pendingAmount: string
  dueDate: string
  status: InvoiceStatus
}

export interface PaymentResponse {
  id: number
  invoiceId: number
  invoiceNumber: string
  amount: string
  paymentDate: string
  method: PaymentMethod
  receiptNumber: string | null
  notes: string | null
  registeredById: number
}
