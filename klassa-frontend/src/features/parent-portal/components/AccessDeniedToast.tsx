'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/** Explains a silent proxy bounce back to `/portal` instead of leaving the parent guessing why. */
export default function AccessDeniedToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) toast.error('No tienes acceso a esa sección')
  }, [show])
  return null
}
