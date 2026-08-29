'use client'

import { useEffect } from 'react'
import { useSelectedChild } from '@/shared/store/selected-child'

/**
 * Resolves which child's data a parent-portal page should show. Selection
 * lives in a persisted client-side store (there's no server-readable session
 * for it), so pages fetch every child's data server-side and this hook picks
 * the one to render: the stored selection if it's still one of this family's
 * children, otherwise the first child — which it also persists back to the
 * store so the choice sticks across tabs/pages.
 */
export function useEffectiveChildId(childIds: number[]): number | null {
  const selectedChildId = useSelectedChild((s) => s.selectedChildId)
  const selectChild = useSelectedChild((s) => s.selectChild)

  const isValidSelection = selectedChildId !== null && childIds.includes(selectedChildId)

  useEffect(() => {
    if (childIds.length > 0 && !isValidSelection) {
      selectChild(childIds[0])
    }
  }, [childIds, isValidSelection, selectChild])

  if (childIds.length === 0) return null
  return isValidSelection ? (selectedChildId as number) : childIds[0]
}
