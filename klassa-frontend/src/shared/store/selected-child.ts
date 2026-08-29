import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SelectedChildState {
  selectedChildId: number | null
  selectChild: (id: number) => void
}

export const useSelectedChild = create<SelectedChildState>()(
  persist(
    (set) => ({
      selectedChildId: null,
      selectChild: (id) => set({ selectedChildId: id }),
    }),
    { name: 'klassa-selected-child' },
  ),
)
