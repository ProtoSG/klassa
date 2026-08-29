'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, UserX, Plus, UserCheck } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import UserRoleBadge, { ROLE_LABEL } from './UserRoleBadge'
import UserFormDialog from './UserFormDialog'
import { deactivateUser, activateUser } from '../actions'
import type { UserResponse, UserRole } from '../types'

const FILTER_ROLES: { label: string; value: UserRole | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Docente', value: 'TEACHER' },
  { label: 'Tesorero', value: 'TREASURER' },
  { label: 'Apoderado', value: 'PARENT' },
]

function initials(u: UserResponse) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
}

const AVATAR_BG: Record<UserRole, string> = {
  ADMIN: 'bg-ink text-white',
  TEACHER: 'bg-blue-100 text-blue-700',
  TREASURER: 'bg-purple-100 text-purple-700',
  PARENT: 'bg-muted-fill text-prose',
}

interface Props {
  initialUsers: UserResponse[]
  initialInactiveUsers: UserResponse[]
}

export default function UsersClient({ initialUsers, initialInactiveUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [inactiveUsers, setInactiveUsers] = useState(initialInactiveUsers)
  const [showInactive, setShowInactive] = useState(false)
  const [filterRole, setFilterRole] = useState<UserRole | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserResponse | undefined>(undefined)
  const [deactivateTarget, setDeactivateTarget] = useState<UserResponse | null>(null)
  const [isDeactivating, startDeactivate] = useTransition()
  const [isActivating, startActivate] = useTransition()

  const source = showInactive ? inactiveUsers : users
  const visible = filterRole ? source.filter((u) => u.role === filterRole) : source

  function handleSaved(saved: UserResponse) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id)
      return idx >= 0 ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved]
    })
  }

  function openCreate() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(u: UserResponse) {
    setEditTarget(u)
    setFormOpen(true)
  }

  function handleDeactivate() {
    if (!deactivateTarget) return
    startDeactivate(async () => {
      try {
        await deactivateUser(deactivateTarget.id)
        setUsers((prev) => prev.filter((u) => u.id !== deactivateTarget.id))
        setInactiveUsers((prev) => [...prev, { ...deactivateTarget, active: false }])
        toast.success(`${deactivateTarget.fullName} desactivado`)
        setDeactivateTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al desactivar')
      }
    })
  }

  function handleActivate(u: UserResponse) {
    startActivate(async () => {
      try {
        const reactivated = await activateUser(u.id)
        setInactiveUsers((prev) => prev.filter((x) => x.id !== u.id))
        setUsers((prev) => [...prev, reactivated])
        toast.success(`${reactivated.fullName} reactivado`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al reactivar')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Usuarios</h1>
          <p className="text-prose mt-0.5 text-sm">
            {users.length} activo{users.length !== 1 ? 's' : ''}
            {inactiveUsers.length > 0 && (
              <span className="ml-2 text-ghost">· {inactiveUsers.length} desactivado{inactiveUsers.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-card"
        >
          <Plus size={15} />
          Nuevo usuario
        </button>
      </div>

      {/* Toggle activos / desactivados */}
      <div className="flex items-center gap-1 bg-muted-fill rounded-xl p-1 border border-line w-fit">
        <button
          onClick={() => { setShowInactive(false); setFilterRole(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            !showInactive ? 'bg-ink text-white shadow-card' : 'text-prose hover:text-ink hover:bg-white/60'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => { setShowInactive(true); setFilterRole(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            showInactive ? 'bg-ink text-white shadow-card' : 'text-prose hover:text-ink hover:bg-white/60'
          }`}
        >
          Desactivados
          {inactiveUsers.length > 0 && (
            <span className={`ml-1.5 text-xs ${showInactive ? 'opacity-70' : 'text-ghost'}`}>
              {inactiveUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Role filter — solo en activos */}
      {!showInactive && (
        <div className="flex flex-wrap gap-2">
          {FILTER_ROLES.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilterRole(value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                filterRole === value
                  ? 'bg-ink text-white'
                  : 'bg-muted-fill text-prose hover:bg-white hover:shadow-card border border-transparent hover:border-line'
              }`}
            >
              {label}
              {value && (
                <span className="ml-1.5 opacity-60">
                  {users.filter((u) => u.role === value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card">
          <p className="text-sm text-ghost">
            {showInactive
              ? 'No hay usuarios desactivados.'
              : filterRole
                ? `No hay usuarios con rol ${ROLE_LABEL[filterRole]}.`
                : 'No hay usuarios registrados.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-surface">
                <TableHead className="w-10" />
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((u) => (
                <TableRow key={u.id} className={showInactive ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${AVATAR_BG[u.role]}`}>
                      {initials(u)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-ink">{u.fullName}</p>
                  </TableCell>
                  <TableCell className="text-sm text-prose">{u.email}</TableCell>
                  <TableCell>
                    <UserRoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    {showInactive ? (
                      <button
                        onClick={() => handleActivate(u)}
                        disabled={isActivating}
                        className="p-1.5 rounded-lg text-ghost hover:text-ink hover:bg-accent/20 transition-colors duration-150 disabled:opacity-40"
                        title="Reactivar"
                      >
                        <UserCheck size={14} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-ghost hover:text-ink hover:bg-muted-fill transition-colors duration-150"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(u)}
                          className="p-1.5 rounded-lg text-ghost hover:text-danger hover:bg-danger/10 transition-colors duration-150"
                          title="Desactivar"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        user={editTarget}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="¿Desactivar usuario?"
        description={`${deactivateTarget?.fullName} perderá acceso al sistema.`}
        confirmLabel="Desactivar"
        danger
        loading={isDeactivating}
      />
    </div>
  )
}
