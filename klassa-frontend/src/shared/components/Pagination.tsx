'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange?: (page: number) => void
  itemLabel?: string
}

export default function Pagination({ page, totalPages, totalElements, size, onPageChange, itemLabel = 'elementos' }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  if (totalPages <= 1) return null

  const from = page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  function goTo(p: number) {
    if (onPageChange) {
      onPageChange(p)
      return
    }
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`${pathname}?${next}`)
  }

  const pages = buildPages(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1">
      <p className="text-xs text-ghost">
        {from}–{to} de {totalElements} {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-prose hover:bg-muted-fill disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-ghost">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-ink text-white'
                  : 'text-prose hover:bg-muted-fill'
              }`}
            >
              {(p as number) + 1}
            </button>
          )
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-prose hover:bg-muted-fill disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages: (number | '…')[] = []
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }
  add(0)
  if (current > 3) pages.push('…')
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) add(i)
  if (current < total - 4) pages.push('…')
  add(total - 1)
  return pages
}
