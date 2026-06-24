# SLO compliance

Generated: 2026-06-24T19:21:33.633Z

## SLOs

| SLO | Target | Current | Status | Note |
|---|---|---|---|---|
| availability | 99.5% | 100% | ✓ | Simulated. In prod, query Plausible + Uptime monitoring. |
| bundle_size_gz | 200KB | 137KB | ✓ | Initial JS: 137KB gz (raw: 478KB) |
| latency_p95 | 1500ms | TBDms | ? | Simulated. In prod, use Plausible + custom RUM or Vercel Analytics. |

## Error budget (last 30 days)

- Availability budget: 3.6h/month
- Used: 0h (no incidents in scope)
- Remaining: 3.6h

## Recommendations

1. Set up real uptime monitoring (e.g., BetterStack, UptimeRobot)
2. Add custom timing to Plausible or integrate Vercel Analytics
3. Track SLO violations in sre/POSTMORTEM.md
