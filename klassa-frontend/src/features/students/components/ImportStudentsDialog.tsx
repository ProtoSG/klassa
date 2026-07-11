'use client'

import { useState, useTransition, useRef } from 'react'
import { UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { importStudents } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Button } from '@/components/ui/button'
import type { ImportResult } from '../types'

export default function ImportStudentsDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit() {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    startTransition(async () => {
      try {
        const res = await importStudents(formData)
        setResult(res)
        if (res.errors.length === 0) {
          toast.success(`${res.successCount} de ${res.totalRows} filas importadas`)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al importar el archivo')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white text-ink text-sm font-medium px-4 py-2 rounded-xl cursor-pointer border border-line hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        Importar alumnos
      </button>

      <Dialog open={open} onClose={handleClose} title="Importar alumnos desde Excel" className="max-w-md">
        <div className="flex flex-col gap-4">
          {!result && (
            <>
              <p className="text-xs text-ghost leading-relaxed">
                El archivo debe ser un Excel (.xlsx) con las siguientes columnas, en este orden:{' '}
                <span className="font-medium text-prose">
                  Nombres, Apellidos, Fecha de nacimiento, Sexo (M/F)
                </span>
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-line hover:border-ink/30 transition-colors cursor-pointer p-6 flex flex-col items-center gap-2 text-center"
              >
                <UploadCloud size={22} className="text-ghost" />
                <span className="text-sm text-prose">
                  {file ? file.name : 'Haz clic para seleccionar un archivo .xlsx'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleSubmit} disabled={!file || isPending}>
                  {isPending ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </>
          )}

          {result && (
            <>
              <p className="text-sm text-prose">
                {result.successCount} de {result.totalRows} filas importadas
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-2 text-xs text-prose">
                      Fila {e.rowNumber}: {e.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-1">
                <Button type="button" size="sm" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}
