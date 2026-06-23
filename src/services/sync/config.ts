/**
 * Configuración de Supabase sync.
 * Determina si el sync entre devices está habilitado.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSyncEnabled = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
};

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
});
