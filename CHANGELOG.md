# Changelog

All notable changes to `@kaelith-labs/kb` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This package ships markdown content (primers, best-practices, lenses, review stages, reviewer configs, standards) consumed by `@kaelith-labs/cli`. KB updates can ship independently of server releases within a compatible peer-dep range.

## [0.7.0] — 2026-04-30

First non-alpha publish. Versioning now lockstep with `@kaelith-labs/cli`
since the KB and CLI ship as one product (the CLI seeds the KB via
`project_init`, and KB schema changes need a coordinated CLI bump).
0.0.x-alpha.\* remained the npm prerelease prefix while the schema
churned; 0.7.0 inherits that history under a stable version line.

### Added

- **`vibe` review type — 9 stages + reviewer overlay.** A new multi-stage
  review type targeting AI-generated work, modeled on the `code` review
  type's quality bar. The 9 stages target LLM-specific failure modes that
  a standard code review reads past:
  1. intent fidelity & scope adherence
  2. evidence integrity & reference grounding (hallucinated APIs, RFCs, versions)
  3. constraint & stop-condition adherence
  4. execution completeness (stubs declared done, test.skip inventory, dangling tasks)
  5. self-flagging & uncertainty disclosure
  6. solution fit vs pattern matching
  7. test integrity (mock theater, echo tests, assertion quality)
  8. behavioral assumptions & runtime claims
  9. trust calibration & release confidence

  Plus `reviewers/reviewer-vibe.md` overlay distinguishing the vibe
  reviewer's job ("is this AI-generated work trustworthy?") from a code
  reviewer's ("is this code correct?"). Approximately 4000 lines of
  stage content authored end-to-end by a 1M-context Sonnet 4.6 subagent
  against the code review files as quality reference; full provenance
  recorded on every file. Operator must add `vibe` to
  `config.review.categories` before `review_prepare --type vibe` will
  accept the slug.

### Changed

- **Frontmatter schema accepts arbitrary review_type / reviewer_type
  slugs.** Hardcoding the enum to `code | security | production` meant
  every new review type added via `review_type_create` failed validation
  until a schema bump shipped — exactly the wrong direction. The schema
  now validates shape (kebab-slug) only; `config.review.categories` on
  the operator's side is the source of truth for which slugs are
  routable.
- **Stage cap raised 9 → 15** to match `review_type_create`'s
  `suggested_step_count` maximum.
- **`stage_name` is optional** in stage frontmatter — agent-generated
  drafts often emit `title` only, and downstream consumers can synthesize
  the human-readable name from `title` when absent.

## [0.0.2-alpha.0] — 2026-04-19

### Added

- **`reviewer-security.md`** — hand-authored security reviewer role/overlay
  with adversarial-mindset framing, severity rubric (Critical → Info),
  hard rules (no live exploitation, redact-before-quote, `BLOCK` on
  compliance/architecture), and explicit prompt-injection handling as a
  trust-boundary issue.
- **`reviewer-production.md`** — hand-authored production reviewer
  role/overlay with operational-mindset framing, severity rubric aligned
  to customer data / SLO impact, hard rules (`BLOCK` on unowned services,
  untested recoveries, and rollbacks-by-promise), and explicit
  human-path / runbook requirements.

### Fixed

- The 0.0.1-alpha.0 entry listed "reviewer configs (code / security /
  production)" but only `reviewer-code.md` actually shipped. The two
  missing files now land so the security and production review stages
  have the overlay they expect.

## [0.0.1-alpha.0] — 2026-04-19

Initial alpha. Seed + full legacy port complete.

### Added

- **Full KB corpus** ported from the Vibe Coding Framework 1.5 corpus:
  - 25 primers (mcp, vibe-coding, coding, security, production, and 20 more)
  - 41 best-practices (mcp, coding, security, production, LLM integration, etc.)
  - 21 lenses (accessibility, ai-systems, code-health, cost-efficiency, etc.)
  - 27 review stages (9 × code + 9 × security + 9 × production)
  - Reviewer configs (code / security / production)
  - Company standards + planner-standard
- **Frontmatter schemas** for each KB kind with `.passthrough()` semantics
  so author-facing metadata flows through while engine-critical fields
  remain required.
- **Port script + drift-check CI gate** (`npm run port` / `npm run port:check`).
- **Schema walker** (`npm run validate:kb`) that dispatches by directory and
  validates every `*.md` against its kind's schema.
