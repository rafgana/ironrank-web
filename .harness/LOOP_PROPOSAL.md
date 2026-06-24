# Loop optimization proposals

Generated: 2026-06-24T17:41:30.811Z
Analyzed: 157 log entries (59 in last 7 days)

Total proposals: 16

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

## 2. slow-phase (implementer)

- **Metric**: 3 runs over 3 min in last 7 days
- **Action**: Add to implementer/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 3. slow-phase (architect)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to architect/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 4. high-retry (architect)

- **Metric**: architect_review invoked 5× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 5. high-retry (implementer)

- **Metric**: implementer_fix invoked 8× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 6. high-retry (verifier)

- **Metric**: verifier_audit invoked 8× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 7. high-retry (release-manager)

- **Metric**: release-manager_commit invoked 6× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 8. high-retry (architect)

- **Metric**: architect_plan invoked 3× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 9. high-retry (docs-writer)

- **Metric**: docs-writer_jsdoc invoked 5× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 10. high-retry (implementer)

- **Metric**: implementer_code invoked 4× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 11. high-retry (verifier)

- **Metric**: verifier_reject invoked 5× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 12. high-retry (release-manager)

- **Metric**: release-manager_changelog invoked 4× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 13. high-retry (architect)

- **Metric**: architect_intake invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 14. verify-loop-hell (implementer)

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

## 15. low-success-rate (architect)

- **Metric**: 67% success (8/12)
- **Action**: Add to architect/SKILL.md: 'Review recent failures; tighten the workflow'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs
```

## 16. low-success-rate (release-manager)

- **Metric**: 67% success (8/12)
- **Action**: Add to release-manager/SKILL.md: 'Review recent failures; tighten the workflow'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs
```

