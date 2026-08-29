'use client'

import { useRef, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { uploadStudentPhoto } from '../actions'

interface Props {
  studentId: number
  fullName: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  canManage: boolean
}

export default function StudentPhotoButton({ studentId, fullName, firstName, lastName, photoUrl, canManage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)

        await uploadStudentPhoto(studentId, fd)

        toast.success('Foto actualizada')
        router.refresh()
      } catch (err) {
        setPreview(null)
        toast.error(err instanceof Error ? err.message : 'Error al subir la foto')
      } finally {
        URL.revokeObjectURL(url)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const src = preview ?? photoUrl

  if (!canManage) {
    return (
      <div className="relative w-12 h-12 rounded-full bg-muted-fill flex items-center justify-center shrink-0 text-sm font-medium text-prose overflow-hidden">
        {src ? (
          <img src={src} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <span>{firstName[0]}{lastName[0]}</span>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isPending}
      className="relative w-12 h-12 rounded-full bg-muted-fill flex items-center justify-center shrink-0 text-sm font-medium text-prose group overflow-hidden"
      title="Cambiar foto"
    >
      {src ? (
        <img src={src} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <span>{firstName[0]}{lastName[0]}</span>
      )}
      <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Camera size={14} className="text-white" />
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  )
}
