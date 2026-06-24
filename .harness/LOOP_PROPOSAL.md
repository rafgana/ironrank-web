# Loop optimization proposals

Generated: 2026-06-24T17:59:35.541Z
Analyzed: 148 log entries (50 in last 7 days)

Total proposals: 15

## 1. slow-phase (release-manager)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to release-manager/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 2. slow-phase (architect)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to architect/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to architect/SKILL.md**:

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

- **Metric**: architect_review invoked 3× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 5. high-retry (verifier)

- **Metric**: verifier_approve invoked 4× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 6. high-retry (docs-writer)

- **Metric**: docs-writer_jsdoc invoked 5× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 7. high-retry (release-manager)

- **Metric**: release-manager_pr invoked 3× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 8. high-retry (implementer)

- **Metric**: implementer_fix invoked 6× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 9. high-retry (release-manager)

- **Metric**: release-manager_changelog invoked 7× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 10. high-retry (implementer)

- **Metric**: implementer_code invoked 3× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 11. high-retry (docs-writer)

- **Metric**: docs-writer_readme invoked 3× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 12. high-retry (architect)

- **Metric**: architect_plan invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 13. high-retry (verifier)

- **Metric**: verifier_audit invoked 3× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 14. high-retry (architect)

- **Metric**: architect_intake invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 15. verify-loop-hell (implementer)

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

