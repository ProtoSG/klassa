export type UserRole = 'ADMIN' | 'TEACHER' | 'TREASURER' | 'PARENT'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface UserResponse {
  id: number
  email: string
  role: UserRole
  firstName: string
  lastName: string
  fullName: string
  active: boolean
}
