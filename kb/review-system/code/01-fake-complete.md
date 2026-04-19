---
type: review-stage
review_type: code
stage: 1
stage_name: fake-complete
version: 0.1
updated: 2026-04-18
---

# Stage 1 — Fake-Complete Gate (Code)

> Seed stage. Remaining 26 stages (9 × {code, security, production}) land in M9. Stage 1 is always mandatory and blocks all subsequent stages.

## Purpose

The "fake complete" gate exists because vibe-coded artifacts routinely:

- compile, lint, and have green tests
- look competent on diff
- **do not actually implement the spec**

Before any other review stage runs, confirm the code actually does the thing the spec asked for.

## Checks (Required)

1. **Spec-feature mapping.** For every goal in `plans/<name>-spec.md` (or the project-root spec if no name match), point to the file:line that implements it. Missing mappings are `BLOCK`.
2. **Test-to-spec mapping.** For every spec-named failure mode, identify the test file/case that exercises it. Tests that only cover the happy path do not count.
3. **Mock-tautology check.** Sample 3 tests. If a mock's return shape mirrors the implementation's assumption (i.e. the test would pass against any implementation that returns that shape), flag it.
4. **Placeholder residue.** Grep for `_TBD_`, `TODO`, `FIXME`, `XXX`, `HACK`. Any match that references spec-named work is `NEEDS_WORK` at minimum; a match inside a security-relevant path is `BLOCK`.
5. **Hardcoded paths / URLs / secrets.** Any literal that should have gone through config is `BLOCK`. (Secrets regardless of stage are `BLOCK`.)

## Required Report Format

```markdown
---
type: review-report
stage: 1
stage_name: fake-complete
review_type: code
verdict: PASS | NEEDS_WORK | BLOCK
run_id: code-<ts>
created_at: <iso8601>
reviewer_endpoint: <endpoint-name>
---

# Fake-Complete Report

## Verdict
<PASS|NEEDS_WORK|BLOCK> — <one-sentence why>

## Spec-feature mapping
| Spec goal | Implementation | Status |
|-----------|----------------|--------|
| ...       | src/...:LN     | OK/MISSING |

## Test-to-spec mapping
| Spec failure mode | Test file:case | Status |
| ...               | test/...       | OK/MISSING/TAUTOLOGY |

## Findings
- file:line — severity — description — required change

## Carry-forward
Architecture:
- ...
Verification:
- ...
Security:
- ...
Compliance:
- ...
Supportability:
- ...
Release-confidence:
- ...
```

## Stage-Exit Rules

- `PASS` → Stage 2 auto-advances (if config `review.auto_advance_on_pass=true`) with the carry-forward loaded.
- `NEEDS_WORK` → progression halts. Builder fixes and re-runs Stage 1 (new run id).
- `BLOCK` → progression halts; typically the plan itself needs revision, not just the code.
