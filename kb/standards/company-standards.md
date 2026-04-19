---
type: standard
standard_name: company-standards
version: 0.1
updated: 2026-04-18
---

# Company Standards

> Seed version — ported from the Vibe Coding Framework 1.5 non-negotiables. The MCP server hands this file to planners and builders on every `plan_context` / `build_context` call so they cannot drift from the project-wide invariants. Users are expected to fork this in their own `~/.vcf/kb/standards/` and adapt to their org.

## Non-Negotiables (Author-Facing)

1. **Investigation before action.** A question is not an instruction. Read before writing. If unclear, stop and ask.
2. **Right the first time.** No workarounds, no "clean it up later." The quick fix becomes permanent.
3. **Never fabricate.** When a value is unknown, write `_TBD_` — never a plausible-looking guess.
4. **Stop on failure.** Halt, diagnose, report, wait. Do not patch around a broken state to keep the green bar green.
5. **Log everything.** Non-trivial decisions → ADR-lite. Reviewer disagreements → response log. Commit-level work → daily log via the `post-commit` git hook.
6. **Research before building.** Does this already exist upstream? What is the proven architecture? Answer before you type.
7. **Chain of thought before execution.** Map the full path before walking it.
8. **Tree of thought on hard calls.** Generate 2-3 viable options, evaluate, pick with reasoning, then commit to one.
9. **Document like you'll forget everything.** Because you will.
10. **Design for the next session's memory.** Structure is external memory — schemas, frontmatter, review gates all exist so the next fresh agent can resume.

## Output Discipline

- Return `paths + summary` by default. `content` only with `expand=true`.
- No literal paths in source; everything resolves through `~/.vcf/config.yaml`.
- No secrets in source, in commits, in test data, in logs.
- Any third-party content re-fed to an LLM is marked untrusted in the envelope.

## When in Doubt

If the current milestone doesn't say, fall back to these and the vibe-coding primer. Never invent a non-negotiable at implementation time.
