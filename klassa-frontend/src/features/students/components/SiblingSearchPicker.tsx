'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchLinkableStudents } from '../actions'
import type { StudentResponse } from '../types'

interface Props {
  /** Omit when the student doesn't exist yet (NewStudentDialog) — nothing to exclude from results. */
  excludeStudentId?: number
  selected: StudentResponse | null
  onSelect: (student: StudentResponse) => void
}

/** Search-and-pick UI shared by `LinkExistingFamilyDialog` (post-creation) and `NewStudentDialog`'s "apoderado existente" mode (at creation). */
export default function SiblingSearchPicker({ excludeStudentId, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentResponse[] | null>(null)
  const [isSearching, startSearch] = useTransition()

  function handleSearch() {
    startSearch(async () => {
      try {
        setResults(await searchLinkableStudents(query, excludeStudentId))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al buscar')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          placeholder="Nombre o código del hermano/a"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            // Stop the parent form's own Enter handling (e.g. NewStudentDialog treats
            // Enter as "Siguiente ->") from also firing on top of the search.
            e.stopPropagation()
            handleSearch()
          }}
        />
        <Button type="button" size="sm" onClick={handleSearch} disabled={isSearching || query.trim() === ''}>
          <Search size={14} />
        </Button>
      </div>

      {results !== null && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-ghost text-center py-3">Sin resultados con familia registrada.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors duration-150 ${
                  selected?.id === r.id ? 'border-accent bg-accent/10' : 'border-line bg-white hover:border-trim'
                }`}
              >
                <div>
                  <p className="text-sm text-ink">{r.fullName}</p>
                  <p className="text-xs text-ghost">{r.code}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
