# CI/CD

GitHub Actions workflow que ejecuta los tests E2E (Playwright) en cada push y PR a `master`.

## Qué verifica

- El build de producción funciona (`npm run build`)
- Los 17 escenarios E2E pasan (`node tests/e2e.mjs`)
- Cachea los 200MB de Playwright Chromium entre runs

## Secrets necesarios

| Secret | Requerido | Descripción |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional | Habilita test 6 (sync round-trip). Si falta, ese test se salta; los otros 16 pasan. |

**No se necesita** ningún otro secret. La `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están en el `.env` (publishable).

## Cómo configurarlo

1. Ir a Settings → Secrets and variables → Actions
2. New repository secret → `SUPABASE_SERVICE_ROLE_KEY` → pegar valor
3. Listo. El workflow se ejecuta en cada push.

## Deploy

El deploy es **manual** (no auto-deploy):

```bash
npm run build
rsync -avz --delete dist/ /opt/stack/site/rafagandia/ironrank/
# O desde el server:
# rm -rf /opt/stack/site/rafagandia/ironrank/*
# cp -r ~/ironrank-web/dist/* /opt/stack/site/rafagandia/ironrank/
# nginx -s reload
```

## Caché

- **npm** (~150MB): cachea por `package-lock.json` via `actions/setup-node`
- **Playwright Chromium** (~200MB): cachea en `~/.cache/ms-playwright` por `package.json` hash

Segunda ejecución con mismo `package.json`: ~30s en vez de ~3min.
