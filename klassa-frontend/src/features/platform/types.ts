export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export interface TenantResponse {
  id: number
  subdomain: string
  name: string
  status: TenantStatus
  planId: number
  planName: string
  trialEndsAt: string | null
  createdAt: string
}

export interface Plan {
  id: number
  name: string
  maxStudents: number
  priceMonthly: number
  features: Record<string, unknown>
  active: boolean
}

export interface RegisterTenantRequest {
  subdomain: string
  name: string
  planId: number
  trialDays?: number
  adminEmail: string
  adminFirstName: string
  adminLastName: string
}

export interface TenantProvisionResponse {
  tenant: TenantResponse
  tempPassword: string
}
