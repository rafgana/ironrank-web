# agent-harness-template

> The runtime scaffolding that lets any AI agent (Claude Code, opencode, Cursor, Codex, Aider) operate your project reliably. Modeled on the **5 primitives of an agent harness** (LangChain *Anatomy of an Agent Harness*, 2026-03-10) and the **holaOS** split-process architecture.

```
┌─────────────────────────────────────────────────┐
│  You (human)                                    │
│  - define goals, approve critical commits      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Main AI agent                                  │
│  - reads AGENTS.md + HARNESS.md on init         │
│  - invokes subagents per the task               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Subagents (skills in .claude/skills/)          │
│  5 tech · 4 marketing · 4 product · 4 ops ·    │
│  1 supervisor · 1 loop-engineer                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  CI / Self-improve                              │
│  - tests on every push                          │
│  - self-improve weekly (auto-apply)              │
└─────────────────────────────────────────────────┘
```

## What is this?

A **ready-to-use template** for any project that wants to be operated by AI agents reliably. Inspired by the **state of the art in agent harness engineering (June 2026)**:

- **LangChain** — *Anatomy of an Agent Harness*, *Improving Deep Agents with Harness Engineering*
- **Anthropic** — *Effective Harnesses for Long-Running Agents*, *Demystifying Evals for AI Agents*
- **OpenAI** — *Unrolling the Codex Agent Loop*, *Run Long-Horizon Tasks with Codex*
- **Martin Fowler** — *Harness Engineering* (3 interlocking systems)
- **holaOS** (5.5k★) — split-process harness with capability manifest
- **desloppify** (2.9k★) — agent harness for code quality

## What's included

```
.claude/skills/        # 19 subagent skill bundles (SKILL.md)
  ├── architect/       # plans features
  ├── implementer/     # writes code
  ├── verifier/        # validates (a11y, bundle, tests)
  ├── docs-writer/     # blog posts + docs
  ├── release-manager/ # commits + PRs
  ├── marketing-strategist/, copywriter/, seo-analyst/, growth-hacker/
  ├── product-manager/, ux-researcher/, data-analyst/, customer-support/
  ├── security-auditor/, devops/, data-engineer/, sre/
  ├── supervisor/      # monitors + evolves agents (meta)
  └── loop-engineer/   # optimizes loops + auto-improves (meta)

.harness/              # persistent state + memory
  ├── config.json      # project configuration (parametrizable)
  ├── config.mjs       # config loader
  ├── state.json       # durable state
  ├── plan.json        # work queue
  ├── query.json       # pre-shaped context
  ├── agent-registry.json  # catalog of all subagents
  ├── logs/<date>.jsonl   # one JSONL per day of agent ops
  ├── evals/           # monitor + smoke test results
  ├── FEATURE_INTAKE.md   # template for new features
  ├── SECURITY_AUDIT.md   # last security scan
  ├── PRODUCT_AUDIT.md   # last portfolio audit
  ├── LOOP_REPORT.md     # last loop trace
  ├── LOOP_PROPOSAL.md   # last loop optimization proposals
  ├── SLO.md             # SLO compliance
  └── DB_HEALTH.md       # database health

scripts/                # CLI scripts (executable)
  ├── harness/         # verify, context, evals, log, state, self-improve, init-config
  ├── supervisor/      # monitor, evolve, create-skill, seed-logs
  ├── loop-engineer/   # trace, design, optimize
  ├── product/         # prd-score, jtbd-interview, metrics-pull, ticket-classify, audit-portfolio
  ├── marketing/       # competitor-scan, keyword-research, content-brief, funnel
  └── ops/             # security-audit, deploy-check, db-health, slo-check

.github/workflows/      # GitHub Actions
  ├── ci.yml           # E2E tests on every push
  └── self-improve.yml # weekly auto-improve + auto-commit

AGENTS.md              # system prompt for agents (commit rules)
HARNESS.md             # the contract: 5 primitives, subagents, commands
package.json           # dependencies (marked, gray-matter, cheerio, tsx)
```

## Quick start (in a new project)

```bash
# 1. Use this template in GitHub (or clone)
# 2. In your project:
npx @ironrank/harness init --name "my-project" --stack "react-vite-supabase"

# 3. Customize
# Edit .harness/config.json with your project details
# Fill in TODO items in .claude/skills/*/SKILL.md
# Update agents in .harness/agent-registry.json

# 4. Validate
node scripts/supervisor/monitor.mjs   # 19 agents OK
node scripts/ops/security-audit.mjs  # 0 CRITICAL
node tests/e2e.mjs                    # all pass

# 5. Push to GitHub
git push
# CI runs, weekly self-improve kicks in
```

## Quick start (in an existing project)

```bash
# 1. Copy the harness files
cp -r .harness/ .claude/ scripts/ AGENTS.md HARNESS.md <your-project>/
cp .github/workflows/{ci,self-improve}.yml <your-project>/.github/workflows/

# 2. Edit .harness/config.json with your project details
# 3. Run scripts/harness/init-config.mjs to generate SKILL.md templates
# 4. Customize SKILL.md files
# 5. Push and let the self-improve kick in
```

## The 5 primitives

Every harness is a composition of these five. This template instantiates all of them.

### 1. Filesystem + Git (durable state)

State lives on disk, not in memory. Three files in `.harness/state/`:

- `state.json` — schema version, last verify, last commit
- `plan.json` — work queue, current task, completed tasks
- `query.json` — pre-shaped working memory (≤ 2MB, like desloppify)

### 2. Bash + Code Execution (general-purpose tool)

The agent can run any shell command. Pre-built tools are secondary; the agent writes code to solve problems.

**Allowed without confirmation**: `node`, `npx`, `npm`, `cat`, `grep`, `ls`, `git status/diff/log/add/commit/push`, scripts in `scripts/`.

**Requires user confirmation**: any write to `dist/`, `rm -rf`, anything touching `.env`.

### 3. Sandbox + Verification (self-verification loop)

`scripts/harness/verify.sh` runs the full validation chain: `tsc + build + E2E tests`. The agent must run it after any non-trivial change. The CI workflow at `.github/workflows/ci.yml` runs the same verification on every push.

### 4. Memory + Skills (context + progressive disclosure)

- **Repo-local memory**: `AGENTS.md` — project-level instructions
- **Skills** in `.claude/skills/<skill>/SKILL.md` — loadable bundles

### 5. Orchestration + Hooks (subagents + gates)

Subagents are specialized role-prompts. The agent is the orchestrator.

## Subagents (19 total)

| Team | Subagent | Purpose |
|---|---|---|
| tech | architect | Plans features, evaluates blast radius |
| tech | implementer | Writes code following the plan |
| tech | verifier | Validates changes (a11y, bundle, tests) |
| tech | docs-writer | Writes blog posts, updates docs |
| tech | release-manager | Commits and opens PRs |
| marketing | marketing-strategist | GTM, positioning, channels |
| marketing | copywriter | Landings, emails, ads |
| marketing | seo-analyst | SEO audit, keywords |
| marketing | growth-hacker | A/B experiments |
| product | product-manager | PRDs, RICE scoring |
| product | ux-researcher | Personas, JTBD interviews |
| product | data-analyst | Metrics, funnel, cohorts |
| product | customer-support | Tickets, empathetic responses |
| ops | security-auditor | OWASP, secrets, GDPR, headers |
| ops | devops | Deploys, infra, CI/CD |
| ops | data-engineer | Schema, RLS, indexes, queries |
| ops | sre | SLOs, post-mortems |
| meta | supervisor | Creates, monitors, evolves subagents |
| meta | loop-engineer | Optimizes loops + auto-improves SKILL.md |

## CLI

```bash
# Harness
./scripts/harness/init-config.mjs    # scaffold .harness/ in a new project
./scripts/harness/verify.sh          # tsc + build + E2E tests
./scripts/harness/context.sh         # dump project state
./scripts/harness/evals.sh           # SEO + a11y + bundle smoke
./scripts/harness/log.sh             # append a trace entry
./scripts/harness/state.mjs          # read/write harness state
./scripts/harness/self-improve.sh    # run the full self-improve pipeline

# Supervisor
node scripts/supervisor/monitor.mjs           # health of all 19 agents
node scripts/supervisor/evolve.mjs            # detect overlap, gaps, drift
node scripts/supervisor/create-skill.mjs      # scaffold a new subagent
node scripts/supervisor/seed-logs.mjs         # generate synthetic logs

# Loop-engineer
node scripts/loop-engineer/loop-trace.mjs     # measure performance
node scripts/loop-engineer/loop-design.mjs    # scaffold a loop
node scripts/loop-engineer/loop-optimize.mjs  # detect + auto-apply improvements

# Product
node scripts/product/prd-score.mjs            # RICE score a feature
node scripts/product/jtbd-interview.mjs        # generate interview script
node scripts/product/metrics-pull.mjs         # pull metrics
node scripts/product/ticket-classify.mjs      # classify a ticket
node scripts/product/audit-portfolio.mjs      # initial portfolio audit

# Marketing
node scripts/marketing/competitor-scan.mjs    # scan a competitor URL
node scripts/marketing/keyword-research.mjs   # keyword opportunities
node scripts/marketing/content-brief.mjs      # content brief
node scripts/marketing/funnel.mjs             # funnel analysis

# Ops
node scripts/ops/security-audit.mjs          # security scan
node scripts/ops/deploy-check.mjs             # pre-deploy checks
node scripts/ops/db-health.mjs                # DB health
node scripts/ops/slo-check.mjs                # SLO compliance
```

## Autonomy levels

This template runs in **autonomous mode by default**.

### What runs autonomously
- ✅ Tests E2E on every push
- ✅ Auto-apply improvements to SKILL.md (Mondays 8am UTC)
- ✅ Detect bottlenecks + propose fixes
- ✅ Monitor health of all 19 agents
- ✅ Generate logs, metrics, security audits

### What still requires human approval
- ❌ Schema changes (IDB or Supabase)
- ❌ Dependency additions (new npm packages)
- ❌ Deletion of subagents
- ❌ Deployment to production

### How autonomy is bounded
- **Hard guardrails** in scripts (forbidden paths, daily rate limits, no deletes)
- **Git history** as the rollback mechanism
- **Tests must pass** before any auto-commit
- **Open issues** when manual review is needed

## References

- [Anatomy of an Agent Harness](https://blog.langchain.com/anatomy-of-an-agent-harness/) — LangChain
- [Frameworks, Runtimes, and Harnesses, oh my!](https://blog.langchain.com/frameworks-runtimes-and-harnesses/) — Harrison Chase
- [Harness Engineering](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html) — Martin Fowler
- [Improving Deep Agents with Harness Engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/) — LangChain
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-long-running) — Anthropic
- [Run Long-Horizon Tasks with Codex](https://openai.com/index/run-long-horizon-tasks-with-codex/) — OpenAI
- [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) — community list
- [awesome-agent-harness](https://github.com/picrew/awesome-agent-harness) — community list

## License

MIT © 2026 IronRank contributors
