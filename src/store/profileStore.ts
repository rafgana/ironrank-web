import { create } from 'zustand'
import { db, getProfile } from '../db/database'
import type { UserProfile } from '../models/types'

interface ProfileState {
  profile: UserProfile | null
  load: () => Promise<void>
  update: (partial: Partial<UserProfile>) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,

  load: async () => {
    const p = await getProfile()
    set({ profile: p })
  },

  update: async (partial) => {
    const current = get().profile
    if (!current?.id) return
    const updated = { ...current, ...partial }
    await db.userProfile.update(current.id, updated)
    set({ profile: updated })
  },
}))
