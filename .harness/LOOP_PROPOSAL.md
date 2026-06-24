# Loop optimization proposals

Generated: 2026-06-24T19:05:43.208Z
Analyzed: 132 log entries (34 in last 7 days)

Total proposals: 9

## 1. high-retry (implementer)

- **Metric**: implementer_test invoked 5× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 2. high-retry (docs-writer)

- **Metric**: docs-writer_jsdoc invoked 5× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 3. high-retry (architect)

- **Metric**: architect_intake invoked 4× in 7 days
- **Action**: Add to architect/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to architect/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 4. high-retry (implementer)

- **Metric**: implementer_fix invoked 3× in 7 days
- **Action**: Add to implementer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 5. high-retry (docs-writer)

- **Metric**: docs-writer_readme invoked 3× in 7 days
- **Action**: Add to docs-writer/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to docs-writer/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 6. high-retry (release-manager)

- **Metric**: release-manager_pr invoked 4× in 7 days
- **Action**: Add to release-manager/SKILL.md: 'If task fails, diagnose first; do not retry blindly'
- **Proposed diff to release-manager/SKILL.md**:

```diff
+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop
```

## 7. verify-loop-hell (implementer)

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

## 8. low-success-rate (implementer)

- **Metric**: 63% success (5/8)
- **Action**: Add to implementer/SKILL.md: 'Review recent failures; tighten the workflow'
- **Proposed diff to implementer/SKILL.md**:

```diff
+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs
```

## 9. low-success-rate (verifier)

- **Metric**: 60% success (3/5)
- **Action**: Add to verifier/SKILL.md: 'Review recent failures; tighten the workflow'
- **Proposed diff to verifier/SKILL.md**:

```diff
+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs
```

