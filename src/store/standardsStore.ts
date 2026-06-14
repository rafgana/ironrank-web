import { create } from 'zustand'
import { loadStandards, type StandardsPayload } from '../services/rankingService'

interface StandardsState {
  standards: StandardsPayload | null
  loading: boolean
  error: Error | null
  load: () => Promise<void>
}

export const useStandardsStore = create<StandardsState>((set, get) => ({
  standards: null,
  loading: false,
  error: null,

  load: async () => {
    if (get().standards || get().loading) return
    set({ loading: true, error: null })
    try {
      const s = await loadStandards()
      set({ standards: s, loading: false })
    } catch (e) {
      set({ error: e as Error, loading: false })
    }
  },
}))
