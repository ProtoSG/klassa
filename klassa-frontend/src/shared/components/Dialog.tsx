'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] animate-backdrop-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 bg-white rounded-2xl shadow-hover w-full p-6 animate-dialog-in',
          'max-h-[90vh] overflow-y-auto',
          'max-w-sm',
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-muted-fill hover:bg-line flex items-center justify-center transition-colors duration-200"
          aria-label="Cerrar"
        >
          <X size={14} className="text-prose" />
        </button>

        <div className="pr-8">
          <h2 id="dialog-title" className="text-base font-medium text-ink">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-prose mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>

        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>,
    document.body
  )
}
