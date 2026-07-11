'use client'

import { useState } from 'react'
import { Dialog } from './Dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  /** For truly irreversible actions: the confirm button stays disabled until this is typed exactly. */
  confirmText?: string
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  confirmText,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  // Reset the typed confirmation when the dialog closes, without an effect: adjust state
  // during render by comparing against the previous `open` value (react.dev's recommended
  // pattern for "reset state when a prop changes").
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) setTyped('')
  }

  const confirmDisabled = loading || (!!confirmText && typed !== confirmText)

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col gap-3">
        {confirmText && (
          <label className="flex flex-col gap-1.5 text-xs text-ghost">
            Escribe <span className="font-mono font-medium text-ink">{confirmText}</span> para confirmar
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl text-xs font-medium px-3 py-1.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] ${
              danger
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-ink text-white shadow-card hover:shadow-hover'
            }`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
