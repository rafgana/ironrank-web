/**
 * Sync store — wrapper reactivo sobre syncEngine.
 */
import { create } from "zustand";
import {
  getSyncState,
  subscribeSync,
  sync,
  type SyncState,
  markDirty,
} from "./syncEngine";

interface SyncStoreState extends SyncState {
  triggerSync: () => Promise<void>;
  markDirty: () => void;
}

export const useSyncStore = create<SyncStoreState>((set) => {
  // Suscribirse al engine para mantener el store sincronizado
  subscribeSync((s) => set(s));
  return {
    ...getSyncState(),
    triggerSync: async () => {
      await sync();
      set(getSyncState());
    },
    markDirty,
  };
});
