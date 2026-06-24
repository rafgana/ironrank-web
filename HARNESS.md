# IronRank Harness

The runtime scaffolding that lets any AI agent (opencode, Claude Code, Codex, Cursor, Aider) operate IronRank reliably. Modeled on the **5 primitives of an agent harness** (LangChain *Anatomy of an Agent Harness*, 2026-03-10) and the **holaOS** split-process architecture.

> "Agent = Model + Harness. If you're not the model, you're the harness." — V. Trivedy, LangChain

## Stack

- **Frontend**: React 19 + Vite 8 + Tailwind 4
- **State**: Zustand 5 + Dexie 4 (IndexedDB)
- **Backend**: Supabase (EU West, GDPR)
- **PWA**: Service Worker, offline-first
- **Tests**: Playwright (21 E2E)
- **AI agents**: opencode (m3-minimax), Claude Code, Cursor, etc. — any agent that reads `.claude/skills/` or `AGENTS.md`

## The 5 Primitives

Every harness is a composition of these five. The IronRank harness instantiates all of them.

### 1. Filesystem + Git (durable state)

State lives on disk, not in memory. Three files in `.harness/state/`:

- `state.json` — schema version, schema state, schema migrations
- `plan.json` — work queue, current task, completed tasks
- `query.json` — pre-shaped working memory (≤ 2MB, like desloppify)

Subagents and humans share this filesystem as the source of truth.

### 2. Bash + Code Execution (general-purpose tool)

The agent can run any shell command. Pre-built tools are secondary; the agent writes code to solve problems.

**Allowed without confirmation**: `node`, `npx`, `npm`, `cat`, `grep`, `ls`, `git status/diff/log/add/commit/push`, scripts in `scripts/`.

**Requires user confirmation**: any write to `dist/`, `rm -rf`, anything touching `.env`, anything in `/opt/stack/`.

### 3. Sandbox + Verification (self-verification loop)

`scripts/harness/verify.sh` runs the full validation chain: `tsc --noEmit && npm run build && node tests/e2e.mjs`. The agent must run it after any non-trivial change. Output is the ground truth for "did I break anything".

The CI workflow at `.github/workflows/ci.yml` runs the same verification on every push.

### 4. Memory + Skills (context + progressive disclosure)

Two layers:

- **Repo-local memory**: `AGENTS.md` (this file's companion) — project-level instructions that survive any session
- **Skills** in `.claude/skills/<skill-name>/SKILL.md` — loadable bundles (architect, implementer, verifier, docs-writer, release-manager) with versioned frontmatter

Skills use **progressive disclosure**: frontmatter (name, description, version) is loaded at startup, full content only on demand. This prevents context rot.

### 5. Orchestration + Hooks (subagents + gates)

Subagents are specialized role-prompts in `.claude/skills/<role>/SKILL.md`. The agent (this AI) is the orchestrator: it spawns subagents for planning, implementation, verification, docs, and release.

**Hard gates** (enforced by hooks):
- After any code change → must run `verify` before commit
- Before any commit → must pass `verify` + lint
- Before any push to `master` → must pass CI (which re-runs `verify`)
- Any new IDB schema change → must bump `CURRENT_SCHEMA_VERSION` and add migration

## Subagents

Five specialized roles (in `.claude/skills/<role>/SKILL.md`):

| Role | Purpose | Reads | Writes |
|---|---|---|---|
| **architect** | Plans features, evaluates blast radius, designs schema | repo, `HARNESS.md`, `state.json` | `FEATURE_INTAKE.md`, `plan.json` |
| **implementer** | Writes code following conventions | `architect` output, `AGENTS.md` | source files, tests |
| **verifier** | Validates changes (a11y, bundle, tests) | diff, `verify` output | trace log, `plan.json` |
| **docs-writer** | Updates README, blog, comments | code, `state.json` | `content/posts/*.md`, JSDoc |
| **release-manager** | Commits, opens PRs, drafts changelog | `plan.json`, diffs | commits, PR bodies |

## Commands (CLI)

The harness exposes a small CLI at `scripts/harness/`:

```bash
./scripts/harness/verify.sh     # tsc + build + 21 E2E tests
./scripts/harness/context.sh    # dump project state (architecture, deps, last 10 commits, recent log)
./scripts/harness/evals.sh      # smoke tests for features (a11y, SEO, perf)
./scripts/harness/log.sh        # append a trace entry
./scripts/harness/state.sh      # read/write harness state files
```

## State

```
.harness/
├── state.json          # schema, last_verified_at, last_commit_sha
├── plan.json           # work queue: [ { id, role, status, started_at, ... } ]
├── query.json          # pre-shaped context for the next agent turn
├── logs/
│   ├── 2026-06-24.jsonl   # one line per agent operation
│   └── ...
└── evals/
    ├── a11y.json       # axe-core results per URL
    ├── seo.json        # JSON-LD + sitemap + robots validation
    └── perf.json       # bundle sizes + gzip transfer
```

## Conventions

- **Conventional Commits** with 4-part message (see AGENTS.md)
- **Spanish** in UI copy, **English** in code/comments/commits
- **No emojis** in user-facing content (user explicitly rejected)
- **Tone**: direct, no-jargon, honest about limitations
- **Privacy**: EU West Supabase, GDPR, no tracking beyond Plausible (cookieless)
- **Performance budget**: < 200KB initial JS (gzipped), < 50KB initial CSS

## What the harness is NOT

- Not a framework (no opinionated abstractions over the code)
- Not a runtime (no long-lived process; the agent runs the harness ad-hoc)
- Not a tool wrapper (not a single LLM call)

## Autonomous mode (default)

The harness runs in **autonomous mode** by default. The user has chosen to delegate all non-destructive decisions to the agents.

### What runs autonomously

- **loop-engineer**: detects and auto-applies improvements to other agents' SKILL.md
- **supervisor**: monitors agent health, flags drift, proposes new agents
- **CI**: runs tests on every push, runs evals on master, runs self-improve weekly
- **release-manager**: commits and pushes when the harness detects changes

### What still requires human approval

- **Schema changes** to IDB (migrations)
- **Dependency additions** (new packages in package.json)
- **Deletion of subagents**
- **Deployment** to production (still manual: `rsync` or `git pull` on server)
- **Anything that costs money** (API keys, paid services)

### How autonomy is bounded

- **Hard guardrails** in scripts (forbidden paths, daily rate limits, no deletes)
- **Git history** as the rollback mechanism (`git revert` if a bad change is pushed)
- **Open issues** when manual review is needed (via `gh issue create`)
- **Tests must pass** before any auto-commit is pushed

## References

- [Anatomy of an Agent Harness](https://blog.langchain.com/anatomy-of-an-agent-harness/) — LangChain, 2026-03-10
- [Frameworks, Runtimes, and Harnesses, oh my!](https://blog.langchain.com/frameworks-runtimes-and-harnesses/) — Harrison Chase
- [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps) — Anthropic
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering) — Anthropic
- [Writing Effective Tools for Agents](https://www.anthropic.com/engineering/writing-effective-tools) — Anthropic
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-long-running) — Anthropic
- [Harness Engineering](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html) — Martin Fowler
- [Harness engineering for coding agent users](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-coding-agent-users.html) — Birgitta Böckeler
- [Unrolling the Codex Agent Loop](https://openai.com/index/unrolling-the-codex-agent-loop/) — OpenAI
- [Run Long-Horizon Tasks with Codex](https://openai.com/index/run-long-horizon-tasks-with-codex/) — OpenAI
- [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) — community list
- [awesome-agent-harness](https://github.com/picrew/awesome-agent-harness) — community list
