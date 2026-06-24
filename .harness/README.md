# .harness/

The agent harness runtime for IronRank. Modeled on the **5 primitives of an agent harness** (LangChain, Anthropic, OpenAI, holaOS).

## Structure

```
.harness/
├── FEATURE_INTAKE.md       # template for new features
├── state/                  # persistent harness state (durable, survives sessions)
│   ├── state.json          # schema version, last verify, last commit
│   ├── plan.json           # work queue
│   └── query.json          # pre-shaped context for next turn
├── logs/                   # one JSONL file per day (one line per agent op)
│   └── YYYY-MM-DD.jsonl
└── evals/                  # smoke test results (SEO, a11y, perf)
    └── last.json
```

## CLI

```bash
./scripts/harness/verify.sh      # tsc + build + 21 E2E tests
./scripts/harness/context.sh     # dump project state (file tree, recent commits, harness state)
./scripts/harness/evals.sh       # SEO + a11y + bundle size smoke tests
./scripts/harness/log.sh         # append a trace entry to today's log
./scripts/harness/state.mjs      # read/write harness state files
```

## Subagents (in `.claude/skills/`)

| Role | Purpose |
|---|---|
| **architect** | Plans features, evaluates blast radius |
| **implementer** | Writes code following the plan + conventions |
| **verifier** | Validates changes (a11y, bundle, tests) |
| **docs-writer** | Writes blog posts, updates docs |
| **release-manager** | Commits and opens PRs |

## Workflow

```
user request
  ↓
architect → FEATURE_INTAKE.md
  ↓
implementer → code changes
  ↓
verifier → APPROVE/REJECT
  ↓ (if APPROVE)
docs-writer (if user-facing) → blog post
  ↓
release-manager → commit + push
```

## References

See `HARNESS.md` for the full contract and source repos that inspired this design.
