import { Home, GraduationCap, ClipboardList, Receipt, CalendarDays } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ParentNavItem {
  href: string
  icon: LucideIcon
  label: string
}

/**
 * Own nav config for the parent portal — deliberately not `TENANT_NAV_ITEMS`
 * (`@/shared/lib/nav-items`), which is scoped to the admin/teacher/treasurer
 * desktop chrome and carries routes (`/students`, `/users`, ...) a parent
 * can't access.
 */
export const PARENT_NAV_ITEMS: ParentNavItem[] = [
  { href: '/portal', icon: Home, label: 'Inicio' },
  { href: '/portal/notas', icon: GraduationCap, label: 'Notas' },
  { href: '/portal/asistencia', icon: ClipboardList, label: 'Asistencia' },
  { href: '/portal/pagos', icon: Receipt, label: 'Cobros' },
  { href: '/portal/calendario', icon: CalendarDays, label: 'Calendario' },
]
