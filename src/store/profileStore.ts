/**
 * Store de perfil — lee/escribe de Supabase (no IndexedDB).
 * El trigger `handle_new_user` crea el perfil en signup.
 * El sync engine se encarga de mantener IndexedDB local sincronizado.
 */
import { create } from "zustand";
import { db } from "../db/database";
import { getSupabase } from "../services/auth/supabaseClient";
import { logAction } from "../services/actionLog";
import { markDirty } from "../services/sync/syncEngine";
import type { UserProfile } from "../models/types";

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  update: (partial: Partial<UserProfile>) => Promise<void>;
}

function fromRemote(row: Record<string, unknown>): UserProfile {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out as unknown as UserProfile;
}

function toRemote(profile: Partial<UserProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(profile)) {
    out[snakeCase(k)] = v;
  }
  return out;
}

function snakeCase(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ profile: null, loading: false });
        return;
      }
      const { data, error } = await supabase
        .from("user_profile")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      const profile = fromRemote(data);
      set({ profile, loading: false });
      // Sincronizar también IndexedDB local
      try {
        const all = await db.userProfile.toArray();
        if (all.length > 0) {
          await db.userProfile.put(profile as unknown as UserProfile);
        } else {
          await db.userProfile.add(profile as unknown as UserProfile);
        }
      } catch {
        /* ignore */
      }
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  update: async (partial) => {
    set({ error: null });
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: "No autenticado" });
        return;
      }
      const updated = { ...get().profile, ...partial } as UserProfile;
      const remoteData = toRemote(updated);
      remoteData.id = user.id;
      remoteData.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("user_profile")
        .update(remoteData)
        .eq("id", user.id);
      if (error) {
        set({ error: error.message });
        return;
      }
      set({ profile: updated });
      markDirty();
      const changedKeys = Object.keys(partial);
      if (changedKeys.length > 0) {
        logAction("profile_updated", { changed: changedKeys.join(",") });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));
