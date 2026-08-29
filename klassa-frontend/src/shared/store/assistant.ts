import { create } from 'zustand'

interface AssistantChatState {
  open: boolean
  toggle: () => void
  close: () => void
}

export const useAssistantChat = create<AssistantChatState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}))
