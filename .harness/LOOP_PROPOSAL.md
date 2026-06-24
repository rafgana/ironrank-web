# Loop optimization proposals

Generated: 2026-06-24T17:53:37.985Z
Analyzed: 155 log entries (57 in last 7 days)

Total proposals: 15

## 1. slow-phase (docs-writer)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to docs-writer/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 2. slow-phase (implementer)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to implementer/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 3. slow-phase (release-manager)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to release-manager/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 4. slow-phase (verifier)

- **Metric**: 2 runs over 3 min in last 7 days
- **Action**: Add to verifier/SKILL.md: 'Break work into smaller steps; commit progress incrementally'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping
```

## 5. high-retry (implementer)

- **Metric**: implementer_code invoked 5× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 6. high-retry (verifier)

- **Metric**: verifier_audit invoked 3× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 7. high-retry (docs-writer)

- **Metric**: docs-writer_jsdoc invoked 4× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 8. high-retry (architect)

- **Metric**: architect_review invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 9. high-retry (verifier)

- **Metric**: verifier_approve invoked 4× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 10. high-retry (docs-writer)

- **Metric**: docs-writer_readme invoked 7× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 11. high-retry (architect)

- **Metric**: architect_plan invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 12. high-retry (release-manager)

- **Metric**: release-manager_changelog invoked 5× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 13. high-retry (implementer)

- **Metric**: implementer_fix invoked 7× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 14. high-retry (verifier)

- **Metric**: verifier_reject invoked 4× in 7 days
- **Action**: Add to verifier/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 15. high-retry (release-manager)

- **Metric**: release-manager_commit invoked 4× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

