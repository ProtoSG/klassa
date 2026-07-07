import { LayoutDashboard, Users, BookOpen, ClipboardList, Receipt, UserCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/shared/store/session'

export interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  roles: UserRole[]
}

export const TENANT_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Inicio',     roles: ['ADMIN', 'TEACHER', 'TREASURER', 'PARENT'] },
  { href: '/students',       icon: Users,           label: 'Alumnos',    roles: ['ADMIN', 'TEACHER'] },
  { href: '/academic-years', icon: BookOpen,        label: 'Académico',  roles: ['ADMIN', 'TEACHER'] },
  { href: '/attendance',     icon: ClipboardList,   label: 'Asistencia', roles: ['ADMIN', 'TEACHER'] },
  { href: '/billing',        icon: Receipt,         label: 'Cobros',     roles: ['ADMIN', 'TREASURER'] },
  { href: '/users',          icon: UserCheck,       label: 'Usuarios',   roles: ['ADMIN'] },
]
