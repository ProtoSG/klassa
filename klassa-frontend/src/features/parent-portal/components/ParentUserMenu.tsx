'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { logout } from '@/features/auth/actions'
import { useSession } from '@/shared/store/session'

/** Same dropdown pattern as `@/features/tenant/components/TenantUserMenu`, trimmed to what a parent needs. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export default function ParentUserMenu() {
  const { user, clearSession } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  function handleLogout() {
    startTransition(async () => {
      await logout()
      clearSession()
      router.push('/auth/login')
    })
  }

  if (!user) return null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label="Cuenta"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-accent/40 text-ink flex items-center justify-center text-xs font-medium hover:bg-accent/60 transition-colors duration-150"
      >
        {initials(user.fullName) || <User size={15} />}
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-50 min-w-[200px] rounded-xl border border-line bg-white shadow-hover p-1.5 animate-dialog-in"
        >
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="text-sm font-medium text-ink leading-tight">{user.fullName}</p>
            <p className="text-xs text-ghost mt-0.5">Apoderado</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors duration-150 disabled:opacity-50"
          >
            <LogOut size={15} />
            {isPending ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
