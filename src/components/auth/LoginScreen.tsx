"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ironrank/Logo";
import { useAuthStore } from "../../services/auth/authStore";
import { logAction } from "../../services/actionLog";
import { track } from "../../services/analytics";
import { isSupabaseConfigured } from "../../services/auth/supabaseClient";
import { validateEmail, validatePassword } from "../../services/validation";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const auth = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    logAction("login_screen_shown", { mode });
  }, [mode]);

  async function handleGoogle() {
    track("login_started", { provider: "google" });
    logAction("login_started", { provider: "google" });
    await auth.signInWithGoogle();
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      auth.setErrorDirectly(emailError);
      return;
    }
    const passError = validatePassword(password);
    if (passError) {
      auth.setErrorDirectly(passError);
      return;
    }
    if (mode === "signup") {
      track("signup_started", { provider: "email" });
      logAction("signup_started", { provider: "email", email_domain: email.split("@")[1] });
      await auth.signUpWithEmail(email, password);
    } else {
      track("login_started", { provider: "email" });
      logAction("login_started", { provider: "email" });
      await auth.signInWithEmail(email, password);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
        <div className="max-w-md w-full card p-6 text-center space-y-4">
          <AlertCircle size={32} className="mx-auto text-yellow-400" />
          <h2 className="text-lg font-display font-semibold">
            Cloud sync no configurado
          </h2>
          <p className="text-sm text-fg-muted">
            Las variables <code>VITE_SUPABASE_URL</code> y
            <code> VITE_SUPABASE_ANON_KEY</code> faltan en el build.
            <br />
            La app sigue funcionando 100% local.
          </p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full card p-8 text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-tier-esmeralda/20 text-tier-esmeralda">
            <Check size={24} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-display font-bold">¡Login exitoso!</h2>
          <p className="text-sm text-fg-muted">Sincronizando tus datos…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full card p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              IronRank
            </h1>
            <p className="text-sm text-fg-muted mt-1">
              Sincroniza entre dispositivos
            </p>
          </div>
        </div>

        {/* Google OAuth */}
        <Button
          onClick={handleGoogle}
          disabled={auth.status === "loading"}
          variant="outline"
          className="w-full h-11"
        >
          <GoogleIcon />
          Continuar con Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-1 px-2 text-fg-dim">o con email</span>
          </div>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleEmail} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-fg-muted" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-fg-muted"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim"
              />
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={auth.status === "loading"}
            className="w-full h-11"
          >
            {auth.status === "loading"
              ? "Conectando…"
              : mode === "signup"
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
        </form>

        {/* Toggle signin/signup */}
        <p className="text-xs text-center text-fg-muted">
          {mode === "signin" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  logAction("login_mode_switch", { to: "signup" });
                }}
                className="text-brand-500 hover:underline font-medium"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  logAction("login_mode_switch", { to: "signin" });
                }}
                className="text-brand-500 hover:underline font-medium"
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>

        {auth.status === "error" && auth.error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300"
          >
            {auth.error}
          </motion.div>
        )}

        <p className="text-[11px] text-fg-dim text-center">
          Tus datos se sincronizan entre devices con tu cuenta.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
