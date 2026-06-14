/**
 * Store de autenticación Supabase.
 * Wrapper sobre @supabase/supabase-js con zustand.
 *
 * - session: null si no hay sesión, User+Session si logueado
 * - status: 'idle' | 'loading' | 'authenticated' | 'error'
 * - signInWithGoogle(): abre OAuth flow
 * - signOut(): cierra sesión
 *
 * La sesión se persiste en localStorage automáticamente por Supabase.
 */
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";
import { logAction } from "../actionLog";

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthState {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;

  /** Carga la sesión persistida. Llamar en cold start. */
  init: () => Promise<void>;
  /** Abre OAuth flow con Google. Redirige al provider. */
  signInWithGoogle: () => Promise<void>;
  /**
   * Apple OAuth (Sign in with Apple).
   * Requiere Apple Developer Program ($99/año) y configurar el provider en Supabase.
   * En Google Cloud Console del proyecto Supabase, ve a Auth → Providers → Apple
   * y configura Services ID + Key Secret.
   * Cuando esté listo, descomenta las líneas en LoginScreen.tsx.
   */
  signInWithApple: () => Promise<void>;
  /** Registro manual con email + password */
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  /** Login con email + password (cuenta ya creada) */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Cierra sesión. */
  signOut: () => Promise<void>;
  /** Setear error sin cambiar status — útil para validación client-side */
  setErrorDirectly: (msg: string | null) => void;
  /** Subscribe a cambios de auth (login/logout). */
  subscribe: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  status: "idle",
  error: null,

  init: async () => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        set({ status: "error", error: error.message });
        return;
      }
      set({
        session: data.session,
        user: data.session?.user ?? null,
        status: data.session ? "authenticated" : "idle",
      });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  signInWithGoogle: async () => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      // Forzar el callback a la URL de producción (rafagandia.com) para evitar
      // que el callback vaya a localhost en entornos dev donde window.location
      // apunta a 127.0.0.1 o localhost:3000. En dev usamos el origin local
      // para que el dev server reciba el callback.
      const isProd =
        window.location.hostname === "rafagandia.com" ||
        window.location.hostname === "www.rafagandia.com";
      const redirectTo = isProd
        ? "https://rafagandia.com/ironrank/"
        : `${window.location.origin}/ironrank/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        set({ status: "error", error: error.message });
      }
      // El navegador se redirige a Google — no necesitamos más aquí
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  signInWithApple: async () => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      const isProd =
        window.location.hostname === "rafagandia.com" ||
        window.location.hostname === "www.rafagandia.com";
      const redirectTo = isProd
        ? "https://rafagandia.com/ironrank/"
        : `${window.location.origin}/ironrank/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo },
      });
      if (error) {
        set({ status: "error", error: error.message });
      }
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  /** Registro manual con email + password */
  signUpWithEmail: async (email: string, password: string) => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://rafagandia.com/ironrank/",
        },
      });
      if (error) {
        set({ status: "error", error: error.message });
        return;
      }
      // Si requiere confirmación de email, Supabase no crea sesión inmediatamente
      if (data.user && !data.session) {
        set({
          status: "error",
          error:
            "Te hemos enviado un email de confirmación. Revisa tu bandeja y haz click en el enlace para activar la cuenta.",
        });
        return;
      }
      // Si Supabase tiene "Confirm email" desactivado, ya hay sesión
      if (data.session) {
        set({
          session: data.session,
          user: data.user,
          status: "authenticated",
        });
      }
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  /** Login con email + password (cuenta ya creada) */
  signInWithEmail: async (email: string, password: string) => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ status: "error", error: error.message });
        return;
      }
      set({
        session: data.session,
        user: data.user,
        status: "authenticated",
      });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  /** Setear error sin cambiar status — útil para validación client-side */
  setErrorDirectly: (msg: string | null) => {
    set({ error: msg });
  },

  signOut: async () => {
    set({ status: "loading", error: null });
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      set({ session: null, user: null, status: "idle", error: null });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  subscribe: () => {
    const supabase = getSupabase();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? "authenticated" : "idle",
        error: null,
      });
      // Log eventos importantes
      if (event === "TOKEN_REFRESHED") {
        logAction("token_refreshed");
      } else if (event === "USER_UPDATED") {
        logAction("user_updated");
      }
      // On login: trigger full sync (push + pull)
      // Solo disparar SIGNED_IN explícito (no INITIAL_SESSION al cargar)
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        setTimeout(() => {
          import("../sync/syncEngine").then(({ fullSyncOnLogin, enableRealtime }) => {
            void fullSyncOnLogin();
            void enableRealtime(session.user.id);
          });
          // Backup automático tras login
          import("../backup").then(({ runAutoBackup }) => {
            void runAutoBackup();
          });
        }, 100);
      }
      // Disable realtime on logout
      if (event === "SIGNED_OUT") {
        import("../sync/syncEngine").then(({ disableRealtime }) => {
          disableRealtime();
        });
      }
    });
    return () => data.subscription.unsubscribe();
  },
}));
