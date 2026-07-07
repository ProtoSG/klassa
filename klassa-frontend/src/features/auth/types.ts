export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  email: string
  fullName: string
  role: 'ADMIN' | 'TEACHER' | 'TREASURER' | 'PARENT' | 'PLATFORM_ADMIN' | 'SUPPORT'
  tenantId: string
}

export interface ChangePasswordRequest {
  email: string
  currentPassword: string
  newPassword: string
}
