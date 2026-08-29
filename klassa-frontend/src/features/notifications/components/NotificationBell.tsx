'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { getMyNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../actions'
import type { NotificationResponse } from '../types'

// Real push doesn't exist yet (planned for the PWA build) — this polls for the
// unread count so the badge doesn't need a manual page reload to update.
// Cheap enough at this interval; revisit if it ever needs to feel more "live".
const POLL_INTERVAL_MS = 60_000

/** Where each notification type sends you when tapped. */
const TYPE_LINK: Record<string, string> = {
  INVOICE_OVERDUE: '/portal/pagos',
  GRADE_ADDED: '/portal/notas',
  ABSENCE_RECORDED: '/portal/asistencia',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<NotificationResponse[] | null>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    function refreshCount() {
      getUnreadNotificationCount()
        .then((n) => { if (!cancelled) setUnreadCount(n) })
        .catch(() => {}) // best-effort — a failed poll just leaves the badge stale, not worth surfacing
    }
    refreshCount()
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

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
    if (!open) {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
      }
      if (items === null) {
        startTransition(async () => {
          try {
            const page = await getMyNotifications()
            setItems(page.content)
          } catch {
            toast.error('Error al cargar notificaciones')
          }
        })
      }
    }
    setOpen((o) => !o)
  }

  function handleItemClick(n: NotificationResponse) {
    if (!n.read) {
      setItems((prev) => prev?.map((i) => (i.id === n.id ? { ...i, read: true } : i)) ?? null)
      setUnreadCount((c) => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {}) // already reflected optimistically; a failed mark-read just means it resurfaces as unread next load
    }
    setOpen(false)
  }

  function handleMarkAllRead() {
    setItems((prev) => prev?.map((i) => ({ ...i, read: true })) ?? null)
    setUnreadCount(0)
    markAllNotificationsRead().catch(() => toast.error('Error al marcar como leídas'))
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label={unreadCount > 0 ? `Notificaciones — ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-danger" />
        )}
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-white shadow-hover animate-dialog-in overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
            <p className="text-sm font-medium text-ink">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-ghost hover:text-ink transition-colors"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isPending && items === null ? (
              <p className="text-xs text-ghost text-center py-6">Cargando...</p>
            ) : !items || items.length === 0 ? (
              <p className="text-xs text-ghost text-center py-6">Sin notificaciones.</p>
            ) : (
              items.map((n) => {
                const href = TYPE_LINK[n.type]
                const content = (
                  <>
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm ${n.read ? 'text-prose' : 'text-ink font-medium'}`}>{n.title}</p>
                      <p className="text-xs text-ghost mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-ghost/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </>
                )
                const className = 'flex items-start gap-2 px-3 py-2.5 border-b border-line last:border-b-0 hover:bg-muted-fill transition-colors duration-150 text-left w-full'
                return href ? (
                  <Link key={n.id} href={href} className={className} onClick={() => handleItemClick(n)}>
                    {content}
                  </Link>
                ) : (
                  <button key={n.id} type="button" className={className} onClick={() => handleItemClick(n)}>
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
