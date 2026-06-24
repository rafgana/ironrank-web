# Loop optimization proposals

Generated: 2026-06-24T18:49:00.753Z
Analyzed: 153 log entries (55 in last 7 days)

Total proposals: 18

## 1. slow-phase (verifier)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to verifier/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 2. slow-phase (release-manager)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to release-manager/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 3. slow-phase (implementer)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to implementer/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 4. high-retry (architect)

- **Metric**: architect_intake invoked 3× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 5. high-retry (verifier)

- **Metric**: verifier_audit invoked 5× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 6. high-retry (docs-writer)

- **Metric**: docs-writer_readme invoked 6× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 7. high-retry (implementer)

- **Metric**: implementer_test invoked 5× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 8. high-retry (release-manager)

- **Metric**: release-manager_pr invoked 4× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 9. high-retry (architect)

- **Metric**: architect_review invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 10. high-retry (architect)

- **Metric**: architect_plan invoked 5× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 11. high-retry (verifier)

- **Metric**: verifier_approve invoked 3× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 12. high-retry (docs-writer)

- **Metric**: docs-writer_post invoked 4× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 13. high-retry (release-manager)

- **Metric**: release-manager_changelog invoked 3× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 14. high-retry (verifier)

- **Metric**: verifier_reject invoked 3× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 15. high-retry (release-manager)

- **Metric**: release-manager_commit invoked 3× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 16. high-retry (implementer)

- **Metric**: implementer_fix invoked 3× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 17. verify-loop-hell (implementer)

- **Metric**: 2 verify failures in 7 days
- **Action**: Add to implementer/SKILL.md: 'Always run verify.sh locally before reporting success; never hand off broken code'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Pre-handoff checklist
+ - [ ] verify.sh passes locally
+ - [ ] No console.log / debugger / TODO
+ - [ ] No secrets in diff
+ - [ ] Bundle size delta < 10%
```

## 18. low-success-rate (architect)

- **Metric**: 67% success (8/12)
- **Action**: Add to architect/SKILL.md: 'Review recent failures; tighten the workflow'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs
```

