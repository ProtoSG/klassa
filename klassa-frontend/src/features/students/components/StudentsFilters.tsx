'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { StudentStatus } from '../types'

const STATUS_TABS: { label: string; value: StudentStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'ACTIVE' },
  { label: 'Inactivos', value: 'INACTIVE' },
  { label: 'Trasladados', value: 'TRANSFERRED' },
]

export default function StudentsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const currentStatus = params.get('status') ?? ''
  const currentSearch = params.get('search') ?? ''

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    startTransition(() => router.push(`${pathname}?${next}`))
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const val = (searchRef.current?.value ?? '').trim()
    update('search', val)
  }

  function clearSearch() {
    if (searchRef.current) searchRef.current.value = ''
    update('search', '')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-muted-fill rounded-xl p-1 border border-line">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => update('status', value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              currentStatus === value
                ? 'bg-ink text-white shadow-card'
                : 'text-prose hover:text-ink hover:bg-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-full sm:w-64">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost pointer-events-none" />
        <input
          ref={searchRef}
          defaultValue={currentSearch}
          placeholder="Buscar alumno..."
          className="w-full pl-9 pr-9 py-2 rounded-xl border border-line bg-white text-sm text-ink placeholder:text-ghost focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent transition-all duration-200"
        />
        {currentSearch && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </form>
    </div>
  )
}
