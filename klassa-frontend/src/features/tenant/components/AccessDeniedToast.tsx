'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/** Explains a silent middleware bounce-to-dashboard instead of leaving the user guessing why. */
export default function AccessDeniedToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) toast.error('No tienes acceso a esa sección')
  }, [show])
  return null
}
