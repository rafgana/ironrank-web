# Security audit

Generated: 2026-06-24T19:05:42.736Z
Scope: IronRank source + live headers

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 0 |
| LOW | 0 |
| INFO | 0 |

✓ No critical issues.

## Findings

### [HIGH] src/services/auth/authStore.ts

- **Description**: No account delete flow (GDPR right to erasure)
- **Remediation**: Implement user-initiated account deletion



## Compliance

- **GDPR**: ✓ privacy policy, ✗ account delete, ✓ data export
- **OWASP Top 10**: covered by findings above
- **CSP**: see live header check

## Recommendations

1. Address all CRITICAL findings before any deploy.
2. Fix HIGH findings within 1 week.
3. Schedule MEDIUM findings for next sprint.
4. Note LOW/INFO for backlog.
