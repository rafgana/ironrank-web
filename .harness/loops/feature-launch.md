# Loop: feature-launch (build)

> <fill in: what this loop accomplishes>

## Type
build — full feature lifecycle: plan → implement → verify → document → release

## Phases

1. **architect** — produce FEATURE_INTAKE.md
   - Expected duration: <5 min
   - Output: `.harness/intake/<name>.md`
   - Abort if: feature out of scope, no user need

2. **implementer** — code + tests
   - Expected duration: <30 min
   - Abort if: verify.sh fails 3 times in a row
   - Output: diff

3. **verifier** — run verify + evals
   - Expected duration: <3 min
   - Abort if: bundle +>10%, a11y critical, no coverage
   - Output: APPROVE / REJECT

4. **docs-writer** — blog post if user-facing
   - Expected duration: <10 min
   - Abort if: feature not user-facing
   - Output: `content/posts/<slug>.md`

5. **release-manager** — commit + push
   - Expected duration: <1 min
   - Abort if: secrets in diff
   - Output: commit

## Success criteria
- All 5 phases complete
- verify.sh passes
- No drift from FEATURE_INTAKE.md

## Retry policy
- Each phase can be re-run up to 2 times
- After 2 retries, escalate to user
- Total budget: 60 min

## Metrics to track
- Phase durations (log to .harness/logs/)
- Retry counts per phase
- Total time to completion
