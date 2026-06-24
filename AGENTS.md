# Repository Guidelines

## User Requirements

- **Always use Context7 MCP** for library/API documentation, code generation, setup steps, and configuration guidance without requiring an explicit user prompt.
- **Always read HARNESS.md first** before any non-trivial task. It defines the harness contract for this project.
- **Harness primitives available** (see HARNESS.md): `verify` (test+build), `context` (dump project state), `evals` (run smoke tests), `log` (append to trace log), `state` (read/write harness state).

## Commit & Pull Request Guidelines

Conventional Commits with a 4-part message structure:

1. First line: `<type>: <imperative summary>` scoped to one cohesive concern.
2. Blank line.
3. Bullet list of what changed and why (APIs, models, migrations, deletions, wiring changes, behavior changes).
4. Validation coverage when relevant.

Commit types: `feat:`, `fix:`, `migrate:`, `chore:`, `refactor:`, `test:`, `docs:`, `perf:`.

PR requirements: context, validation commands, linked issues, screenshots/logs if UI, schema impact if IDB/SQL touched, environment tweaks if needed.
