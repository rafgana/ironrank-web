/**
 * AuthGuard — protege la app. Auth es obligatorio.
 *
 * Si no hay sesión Supabase, muestra LoginScreen.
 * Si hay error de red pero Supabase no responde, también bloquea (no local-first).
 */
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "../../services/auth/authStore";
import { LoginScreen } from "./LoginScreen";
import { logAction } from "../../services/actionLog";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const auth = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      await auth.init();
      unsub = auth.subscribe();
      setReady(true);
    })();
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="text-fg-dim text-sm">Cargando…</div>
      </div>
    );
  }

  if (auth.status === "authenticated") {
    logAction("auth_guard_passed", { user: auth.user?.id?.slice(0, 8) });
    return <>{children}</>;
  }

  // idle, loading, o error → mostrar LoginScreen
  return <LoginScreen />;
}
