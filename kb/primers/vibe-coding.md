---
type: primer
primer_name: vibe-coding
category: type
version: 1.0
updated: 2026-04-18
status: draft-v1
---

# Vibe Coding Primer

## What This Primer Is For

This primer prepares a planner to build a plan that will survive contact with a vibe-coding builder.

It is relevant whenever a project will be authored primarily by an LLM from a natural-language spec — with a human (or meta-agent) guiding, reviewing, and course-correcting rather than writing code line-by-line.

Its purpose is to make the plan opinionated about the exact failure modes vibe coding introduces, so the builder never gets the chance to cause them.

This is the "why" companion to the **Vibe Coding Best Practices** document, which covers the "how."

---

## Read This First

Vibe coding is writing software from a natural-language description while the LLM is the primary author. The human "fully gives in to the vibes" (Karpathy's original framing, Feb 2025), reads diffs at most, runs the output, and prompts again when something is off.

This is a legitimate, high-velocity mode of development. It is also the fastest known way to ship confidently broken software.

The core problem is not that LLMs write bad code. It is that LLMs write **plausible** code. A vibe-coded artifact routinely:

- compiles, runs, and demos cleanly
- has a test file that shows green
- looks competent on inspection
- does not actually do the thing the spec asked for, at the scale the spec required, with the error handling a production system needs

Recent industry research (2025-2026) consistently finds: dozens of CVEs per month attributed to AI-generated code, secret-leak rates several times the public-GitHub baseline, and OWASP Top 10 vulnerabilities in a substantial share of AI-generated samples. These are not prompt-engineering problems. They are planning problems — the plan never told the builder to care.

Your job as planner is to give the builder no room to drift.

---

## What Vibe Coding Is Good For

- ideation velocity and fast prototypes
- glue code, scripts, one-shot tools
- exploratory UIs and internal dashboards
- lowering the barrier for non-engineers to build working software
- code whose failure mode is "delete it and regenerate"

## What Vibe Coding Is Wrong For

- regulated systems (healthcare, finance, legal evidence)
- safety-critical code (medical devices, industrial control, anything that can physically hurt someone)
- anything with durable user data where errors are irreversible
- code that must remain maintainable by humans who were not in the original session
- anything where "plausible but wrong" has a cost curve steeper than "ship and iterate"

If the project falls into the "wrong for" column, the plan should say so explicitly and the review gates should be tighter than normal.

---

## The Core Failure Modes

Each failure mode gets a one-line diagnosis. The plan must either prevent or explicitly accept each one.

- **Fake complete** — code that compiles, passes lint, and has a green test badge, but doesn't actually implement the feature. The builder grepped for the feature name, saw a function, and declared victory.
- **Hardcoded paths, secrets, URLs** — values baked into source because the builder never planned a config layer. Discovered when the code moves to another machine, or leaks to a repo.
- **Happy-path-only tests** — tests that exercise the nominal input and nothing else. AI test generators cluster heavily around success paths and stub out error handling (Testkube, CodeIntelligently, 2025-2026).
- **Mock-only tests** — tests whose mocks return the exact shape the implementation expects, so the suite is tautologically green while the real integration is broken.
- **Not built for scale** — works for one user, dies at ten. Spec said "handles 1000 users," builder tested with one and moved on.
- **Duplicated logic** — the same near-identical function copy-pasted across three files because the LLM regenerated it per prompt instead of extracting it.
- **Comments that describe WHAT, not WHY** — `// increment counter` above `counter++`. Useless for the next reader. The WHY (why this counter, why this increment, why now) is what future-you needs.
- **Brittle error handling** — bare `catch(e) {}` or `except: pass` that swallows everything and marches on. The program "works" until a silent failure makes the data corrupt.
- **Overconfident security assumptions** — input trusted because it looks structured, auth checks omitted because the happy-path test user was admin, CORS wide-open because "it's internal."
- **Dependency bloat and hallucinated packages** — LLMs invent package names at non-trivial rates (observed in a meaningful share of recommendations in 2025 studies); attackers register those names with malware. Unverified installs are a supply-chain risk, not a convenience.
- **Unpinned versions** — `"lodash": "*"` ships and the next `npm install` pulls a different world.
- **Abandonment** — the code works today, and nobody can maintain it tomorrow because no one (human or LLM) can reconstruct the intent from the diff.
- **Prompt-injection surfaces** — user-supplied text gets fed to an LLM later in the pipeline with no sanitization or redaction. Silent RCE-adjacent risk in AI-native products (Windsurf memory-poisoning incidents, CVE-2025-54135 CurXecute via MCP, 2025-2026).

---

## Non-Negotiables (Ported from AGENTS.md, Compressed)

These are not aspirational. The plan must enforce them.

- **Investigation first, action second.** A question is not an instruction. Read before writing.
- **Do it right the first time.** No workarounds, no "clean it up later." The quick fix becomes permanent.
- **Never fabricate.** Placeholder > fabrication. Unknown values stay labelled `_TBD_`, not invented.
- **Stop on failure.** Halt, diagnose, report, wait. No patching around broken state.
- **Log everything.** Decisions, deferred work, mistakes — if it isn't written, it didn't happen.
- **Research before building.** Does this already exist? What's the proven architecture? Brutal questions answered honestly.
- **Design for the ADHD brain.** We won't come back. We won't remember. Structure now reduces load later.
- **Document like you'll forget everything.** Because you will. Why, with examples, with actual commands.
- **Chain of thought before execution.** Map the full path before walking it. If you can't describe the last line, you haven't thought it through.
- **Tree of thought on hard choices.** Generate 2-3 viable options, evaluate, pick with reasoning, then commit.

These exist because vibe-coded projects are authored by agents who have no memory of yesterday's session. Structure is the only thing that survives.

---

## Planning Principles That Counteract the Failure Modes

### 1. Plan the config layer before the feature layer

Every path, every endpoint, every credential, every model alias, every tunable — enumerate them in the plan. The first thing the builder writes is the config loader and schema. Literal paths in source are a plan failure, not a builder failure.

### 2. Plan the test layer at spec time, not after build

For each external dependency (DB, cache, queue, LLM endpoint, payment gateway) the plan must name a dedicated test file. For each user-input path the plan must name a prompt-injection test. For each scale target in the spec the plan must specify a volume test at 10x that target. "Tests" is not a deliverable; "tests that exercise the real failure modes" is.

### 3. Plan the review gates

Where does the builder stop and hand off to a reviewer? The Vibe Coding Framework's 27-stage review exists because vibe-coded code needs more review, not less, and Stage 1 is explicitly the "fake complete" gate — does the code actually do the thing? The plan must say when Stage 1 fires, when security review fires, when production review fires.

### 4. Plan the compaction boundaries

LLM builders lose context. Plan where the builder hands off to a fresh session, and what artifacts (decision log, response log, plan, spec) the next session reads to resume. If the plan doesn't specify compaction points, the builder will hit one at the worst possible moment.

### 5. Plan the builder-type swaps

Backend builder is not the same persona as frontend designer is not the same as infra engineer. Plan the swap explicitly: "at the end of phase 3, compact; next session loads `frontend-best-practices.md` + design system." Without this the builder keeps vibing backend patterns into the UI.

### 6. Plan the documentation

Every non-obvious decision gets an ADR-lite entry at the time the decision is made. Daily log appends on every commit (git hook, not LLM instruction — the hook is authority). The plan names where these live. If the plan doesn't name it, the builder won't write it.

### 7. Plan for the shipping audit

Hardcoded paths, leftover secrets, test data residue, personal data, stale debug flags, `TODO`/`FIXME` referencing incomplete security work — every one of these has been found in production vibe-coded repos. The plan must name the ship audit pipeline and who owns the green light.

---

## Common Early Mistakes (Planner-Facing)

- treating vibe coding as "same as regular coding but faster" — the failure modes are different, not fewer
- letting "AI-powered" replace product definition
- planning features before planning the config layer
- omitting the test plan because "tests will come with the build"
- specifying a scale target without specifying a volume test
- assuming the builder will remember a decision from the spec — it won't
- writing the plan as a flat todo list instead of a phased document with review gates
- no decision log → no review context → reviewer finds the same "bug" on every pass (which is actually a valid design choice nobody recorded)
- trusting model output to be current — training cutoffs are real and library APIs change

---

## What To Think About Before You Start

### 1. Shape
- What kind of project is this? (web app, CLI, service, library, automation, AI-native)
- What are the non-negotiable boundaries — data durability, auth, money, compliance?
- Is vibe coding the right mode here, or should parts be hand-authored?

### 2. Config surface
- What every path, endpoint, secret, and tunable will be?
- What gets env-var interpolation? What stays as YAML?
- Where do config templates live, where do filled configs live, what is gitignored?

### 3. Verification plan
- What is the scale target? What is 10x that target?
- Which dependencies need their own test file?
- Which input paths accept user text and reach an LLM? Those need prompt-injection tests.
- What counts as "the real behavior was tested," not "the mock returned what the mock expected"?

### 4. Failure behavior
- What can fail, and what should happen when it does?
- Where is `catch` narrow and explicit? Where is the structured error envelope?
- What fails loud in development but degrades gracefully in production?

### 5. Handoff design
- Where are the compaction points? What does the next session read?
- Where are the builder-type swaps? What best-practices load at each?
- Where does the reviewer stop the build? What evidence do they get?

### 6. Durability
- Will someone who was not in this session be able to maintain this code in six months?
- If not, what documentation, comments, and ADRs are missing from the plan?

---

## The ADHD Tax — Why Structure Is Not Bureaucracy

Vibe coding amplifies the ADHD problem. Every session is a fresh builder with no memory. Every compaction erases working context. Every "I'll clean it up later" is actually "never."

Structure — config schemas, review gates, decision logs, daily commits, frontmatter, named review stages — is not process weight. It is the external memory the builder (LLM or human) does not have. Without it, the project's working state lives only in chat transcripts that evaporate.

A plan that lists 30 things for the builder to remember will produce a broken build. A plan that puts 30 things into schemas, files, and hooks will produce a working build, because the builder only has to remember to read them.

**Structure reduces cognitive load. It does not add it.** That is the whole thesis behind the AGENTS.md non-negotiables and the Vibe Coding Framework itself.

---

## When To Open The Best-Practice Docs

Open **Vibe Coding Best Practices** as soon as planning transitions to implementation. It is the concrete companion to this primer — config loader shapes, test file layouts, error envelopes, git hook contents, ship-audit steps.

Also open:
- **Coding Best Practices** — underlies everything; the generic layer this primer specializes.
- **Security Best Practices** — before any auth, secret, or external-input path is implemented.
- **LLM Integration Best Practices** — when the product itself uses LLMs at runtime (prompt injection, redaction, fallback).
- **Production Best Practices** — when the project moves from demo to deployable.
- **Git / Change Safety Best Practices** — for commit discipline, daily logs, pre-commit/pre-push hooks.

You do not need to read every deep doc now. You do need to know that the plan must route the builder through them, not leave the builder to improvise.

---

## Related Best Practices

Primary follow-up docs:
- Vibe Coding Best Practices
- Coding Best Practices
- Security Best Practices
- LLM Integration Best Practices
- Production Best Practices
- Project Planning Best Practices
- Git / Change Safety Best Practices

---

## Quick Routing Guide

This primer is strongly recommended for:
- any project where `author_agent` is an LLM and `authoring_style` is vibe-coded
- `application-web`, `application-desktop`, `application-mobile`, `internal-tool`, `api-service` when built primarily through AI
- `automation-workflow` when the automation itself is LLM-authored
- AI-native projects where the LLM is both author and runtime component

It is mandatory when:
- the project will be reviewed by the Vibe Coding Framework's 27-stage review system
- the project uses the VCF-MCP lifecycle (capture → spec → init → plan → build → test → review → ship)
- the builder will be an LLM with no human line-by-line authoring

It is optional when:
- the code is disposable (a one-off script, a notebook, a prompt)
- the project is exploratory and will be thrown away before it sees a second user

---

## Final Standard

Before handing a plan to a vibe-coding builder, you should be able to say:

> I know which failure modes this plan prevents by design, which ones the review gates catch, which ones are accepted risks, and where the builder will stop to hand off. The config layer, test plan, review gates, compaction points, and documentation cadence are named in the plan, not left to the builder's judgment.

If you cannot say that honestly, the plan is not ready and the builder will fill the gaps with plausible guesses. That is exactly how vibe-coded projects fail.
