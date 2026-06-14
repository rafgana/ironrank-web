# IronRank Web - Auth & Sync Setup

## Stack
- **Backend**: Supabase (Postgres + Auth + RLS) en EU West (GDPR)
- **Auth**: Google OAuth via Supabase Auth
- **Sync**: Last-write-wins por `updated_at`, debounced 5s
- **Project ref**: `aemajqeksudfljdzsvfe`
- **Project URL**: https://aemajqeksudfljdzsvfe.supabase.co

## Variables de entorno (cliente)
```env
VITE_SUPABASE_URL=https://aemajqeksudfljdzsvfe.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

Estas vars se inyectan en build time y van al cliente (son públicas).

## Schema (resumen)
- `user_profile` (1 por user, PK = auth.users.id)
- `workouts`, `workout_exercises`, `sets` (jerarquía)
- `routines`, `routine_exercises` (jerarquía)
- `exercises` (catálogo global compartido)
- `appState` (flags del cliente: onboarding, etc.)

RLS habilitado: cada user solo ve/edita sus propias filas. El catálogo `exercises` es público (read-only).

## Triggers
- `on_auth_user_created`: auto-crea perfil en signup
- `*_updated`: mantiene `updated_at` antes de UPDATE

## Storage
- Auth session: localStorage `ironrank.auth.session` (manejado por Supabase)
- Datos locales: IndexedDB `IronRank` (mirror de Supabase para offline)
- Onboarding flag: IndexedDB `appState.onboardingStatus`
- Theme: localStorage

## Flow de auth

1. Usuario abre la app → AuthGuard detecta no auth → muestra LoginScreen
2. Click "Continuar con Google" → Supabase OAuth flow → Google login → callback a `https://rafagandia.com/ironrank/`
3. Supabase setea session en localStorage, dispara `SIGNED_IN` o `INITIAL_SESSION`
4. `authStore.subscribe()` recibe el evento, llama `fullSyncOnLogin()`
5. `fullSyncOnLogin()` hace push (local→cloud) + pull (cloud→local)
6. UI se actualiza, user ve sus datos

## Sync engine

- **Trigger**: cualquier mutación en stores (workoutStore, profileStore, routineStore) llama `markDirty()`
- **Debounce**: 5s para evitar storms
- **Push**: serializa rows locales a snake_case, upsert en Supabase con `onConflict=id`
- **Pull**: query por `user_id` (o `id` para user_profile), desserializa a camelCase, `put` en IDB
- **Conflict resolution**: last-write-wins (no hay UI de merge manual todavía)

## CSP requerida en nginx

```nginx
add_header Content-Security-Policy "default-src 'self';
  script-src 'self' 'unsafe-inline' https://plausible.io;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://formsubmit.co https://plausible.io https://aemajqeksudfljdzsvfe.supabase.co https://accounts.google.com;
  frame-ancestors 'self';" always;
```

Sin `https://aemajqeksudfljdzsvfe.supabase.co` y `https://accounts.google.com` en `connect-src`, el browser bloquea el sync y el OAuth.

## Google Cloud Console setup

OAuth Client ID: `485361890902-gsimev9e4c80g7etiem701n31oclmio9.apps.googleusercontent.com`

Authorized JavaScript origins:
- `https://rafagandia.com`
- `http://localhost:4173`

Authorized redirect URIs:
- `https://aemajqeksudfljdzsvfe.supabase.co/auth/v1/callback`

## Pat para Management API (rotar cada 30 días)

Para modificar la config de Supabase desde CLI: https://supabase.com/dashboard/account/tokens

## Debug

```bash
# Ver estado de providers
curl -s "https://aemajqeksudfljdzsvfe.supabase.co/auth/v1/settings" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" | jq '.external | to_entries | map(select(.key | contains("google")))'

# Test login (requiere usuario creado via admin API)
curl -s "$VITE_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -X POST \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'

# Ver tablas y RLS
psql "$DATABASE_URL" -c "\dt public.*" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';"
```

## Crear usuario de test (admin)

```bash
curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ironrank.local","password":"test1234","email_confirm":true}'
```

El trigger `on_auth_user_created` crea automáticamente el `user_profile`.
