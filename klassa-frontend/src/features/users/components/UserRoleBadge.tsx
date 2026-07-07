import type { UserRole } from '../types'

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  TREASURER: 'Tesorero',
  PARENT: 'Apoderado',
}

const ROLE_CLASS: Record<UserRole, string> = {
  ADMIN: 'bg-ink text-white border-ink',
  TEACHER: 'bg-blue-50 text-blue-700 border-blue-200',
  TREASURER: 'bg-purple-50 text-purple-700 border-purple-200',
  PARENT: 'bg-muted-fill text-prose border-line',
}

export default function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium ${ROLE_CLASS[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  )
}
