# Rafagandia GTM Agency — Agent System

> The autonomous GTM system. 2 subagents (out of 5 planned) that research markets, qualify leads, and write outbound — all on `rafagandia.com`.

## What this does

- **market-researcher**: Given an ICP, finds companies that match. Given a person, builds a dossier.
- **outbound-writer**: Given a dossier, writes a personalized cold email (Spanish or English).

Both run on demand via the `agency` CLI. State is local (filesystem) + synced to Supabase.

## Quick start

```bash
# 1. Run the CLI
./scripts/agency research icp "B2B SaaS, 10-50 employees, Spain" --output prospects.json

# 2. Generate a dossier
./scripts/agency research dossier "Juan Pérez" --company "Acme Inc"

# 3. Write an email
./scripts/agency outbound email --dossier dossiers/juan-perez.md --tone casual

# 4. Sync to Supabase
./scripts/agency sync
```

## Structure

```
agency-system/
├── .harness/                # state, logs, dossiers, sequences
│   ├── config.json          # project config
│   ├── state/               # durable state
│   ├── research/             # raw research output
│   ├── dossiers/            # person/company dossiers
│   ├── sequences/           # outbound sequences
│   └── prospects.json       # qualified leads
├── .claude/skills/          # subagent skill bundles
│   ├── market-researcher/   # ICP search + dossier
│   └── outbound-writer/     # email + LinkedIn DM
├── scripts/                 # CLI
│   ├── agency               # main CLI
│   ├── research/            # research scripts
│   └── outbound/            # outbound scripts
├── tests/                   # E2E tests
└── README.md
```

## Roadmap

- [x] Session 1: Esqueleto + market-researcher + outbound-writer
- [ ] Session 2: lead-enricher + gtm-strategist + pipeline-operator
- [ ] Session 3: Landing page en rafagandia.com
- [ ] Session 4: Integrations (Apollo, Hunter, LinkedIn)
