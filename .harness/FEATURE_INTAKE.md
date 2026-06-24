# FEATURE_INTAKE.md

Template for new features. Copy this file, fill it in, and commit it under `.harness/intake/<feature-slug>.md` before implementation begins.

---

# Feature: <short-name>

## Context
Why this is needed, in 2-3 sentences. Link to user feedback, data, or related issues.

## User story
As a [user type], I want to [action], so that [benefit].

## Blast radius
Files to modify:
- `path/to/file1.ts:<line>` — what changes
- `path/to/file2.tsx:<line>` — what changes

Files at risk (could break):
- `path/to/related.ts:<line>` — why

## Data model
- New tables/columns: `<name>:<type>:<default>:<indexed?>`
- IDB schema version bump: `yes/no` (plan migration in `src/db/database.ts`)
- Supabase migrations: `yes/no` (run `supabase migration new <name>`)

## Risks
- [specific risk 1]
- [specific risk 2]

## Plan

1. **architect** — write this intake (done)
2. **implementer** — make the code changes per the plan
3. **verifier** — run verify + evals, write report
4. **docs-writer** — write blog post if user-facing
5. **release-manager** — commit + open PR

## Validation
- Tests to add: `tests/e2e.mjs` scenario N (description)
- Manual smoke: [list of user flows to test]
- Evals to rerun: `./scripts/harness/evals.sh`

## Effort estimate
S / M / L (LoC change)

## Notes
- [any other context, decisions, links]
