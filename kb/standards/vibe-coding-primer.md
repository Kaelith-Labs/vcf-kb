---
type: standard
standard_name: vibe-coding-planner-standard
version: 0.1
updated: 2026-04-18
---

# Vibe Coding Planner Standard

> Always loaded for every `plan_context` call. This is a compressed, imperative companion to `kb/primers/vibe-coding.md` — the primer explains the *why*; this document is the *must-do* checklist the planner is held to.

## Every Plan Must Name

1. **Config surface.** Every path, endpoint, secret, and tunable. First file the builder writes = config loader + schema.
2. **Test plan.** Per external dependency: one test file. Per user-input path: one prompt-injection test. Per scale target: a volume test at 10× the target.
3. **Review gates.** When does Stage 1 (fake-complete) fire? When does security review fire? When does production review fire?
4. **Compaction boundaries.** Where does the builder hand off to a fresh session, and what artifacts does the next session read?
5. **Builder-type swaps.** Where does backend hand off to frontend / infra? What best-practices load at each swap?
6. **Documentation cadence.** Where ADR-lite entries live, when daily-log append fires, what is gitignored vs committed.
7. **Ship audit pipeline.** Hardcoded-path grep, secrets scan, test-data residue, personal data, stale TODOs on security work. Who owns the green light.

## Every Plan Must Forbid

- `catch (e) {}` / `except: pass` without a specific reason captured in a comment.
- Unpinned dependency versions (`"*"`, `latest`, unpinned `~` where `^` is expected).
- Mocks whose return shape equals the implementation's assumption (tautology tests).
- "Will add tests later" language.
- Any path, URL, or identifier hardcoded in source.
- Tools that edit their own reviewer/planner templates in place (disposable copies only).

## Non-Negotiables on the Plan Itself

- The plan is phased, not a flat todo list.
- Each phase ends at a review gate or a compaction boundary.
- The plan calls out one risk per phase and its mitigation.
- The plan names **when** the builder stops — not "eventually."

If the plan cannot answer the above, it is not ready for handoff.
