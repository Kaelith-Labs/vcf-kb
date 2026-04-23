# @kaelith-labs/kb

The content half of the **Vibe Coding Framework MCP**: primers (discipline layer — _why_), best-practices (mechanics layer — _how_), lenses (focused review perspectives), review stages (27 total), reviewer configs, standards. Zero runtime code — this is a versioned markdown corpus that `@kaelith-labs/cli` reads through `vcf init` and `vcf update-primers`.

Current published version on npm: **0.0.2-alpha.0**. Source tracks ahead of that; a new publish is pending.

## What's inside

```
kb/
  primers/              25 files   what/why for planners
  best-practices/       41 files   how for builders
  lenses/               21 files   accessibility, security-surface, code-health, …
  review-system/
    code/                9 files   Stages 1–9 (project-def → release-confidence)
    security/            9 files   Stages 1–9 (threat-model → release-decision)
    production/          9 files   Stages 1–9 (service-def → governance)
  reviewers/             9 files   reviewer-{code,security,production}.md +
                                   .frontier.md + .local.md variants each
  standards/             3 files   company-standards.md, tag-vocabulary.md,
                                   vibe-coding-primer.md
```

## Delivery model (seed-and-fork)

- `@kaelith-labs/cli` declares `@kaelith-labs/kb` as a regular dependency in the range `>=0.0.1-alpha <0.2.0`. KB updates can ship independently within the compatible band.
- `vcf init` copies `kb/` from `node_modules/@kaelith-labs/kb/` into `~/.vcf/kb/` and seeds `~/.vcf/kb-ancestors/` as the three-way-merge base. The **server reads the user's copy**, never `node_modules`.
- `vcf update-primers` pulls the latest package and performs a three-way merge against the ancestor cache: `added` / `in-sync` / `local-only` / `fast-forward` / `auto-merged` / `conflict`. Exits 7 when any conflict remains (markers written in place). The ancestor cache is updated on a clean run so subsequent updates merge from the correct base.

This decouples content cadence from server cadence. A primer typo fix ships as a KB patch without touching the server.

## Authoring conventions

Every markdown file under `kb/<kind>/` must carry a YAML frontmatter block. Required fields:

```yaml
---
type: primer                          # or best-practice, lens, review-stage, reviewer, standard
primer_name: my-new-primer            # kebab-case, unique within the kind
version: 1.0
updated: 2026-01-15                   # ISO date (YYYY-MM-DD)
tags: [tag-one, tag-two]              # lowercase kebab-case; drives tag-match engine
---
```

For `review-stage` entries the required field is `review_type` (code | security | production) + `stage` (integer 1–9). For `reviewer` entries the required field is `reviewer_type`.

Tag shape is enforced: lowercase kebab-case, matching the vocabulary in `kb/standards/tag-vocabulary.md`. `@kaelith-labs/cli` rejects files that fail frontmatter validation at KB-load time. Run `npm run validate:kb` to check locally before publishing.

Optional fields (`audience`, `supersedes`, `last_reviewed`, `category`, `status`) ride along untouched — the schema uses `.passthrough()` semantics.

## Using a fork

```yaml
# ~/.vcf/config.yaml
kb:
  root: /home/you/your-kb/kb
  upstream_package: "@your/kb"
```

Then `vcf update-primers` pulls from your fork's upstream, not the default `@kaelith-labs/kb`.

## Validation

```bash
npm run validate        # vitest + validate-kb + port:check (CI uses this)
npm run validate:kb     # walk kb/, parse frontmatter, dispatch schema per dir
npm run port:check      # ensure kb/ byte-for-byte matches source docs after transforms
```

## Publishing updates

1. Make content edits under `kb/`.
2. Run `npm run validate` — must be clean.
3. Bump `version` in `package.json` (semver patch for corrections, minor for new entries).
4. `npm publish` — users pick up via `vcf update-primers`.

The three-way ancestor cache in `~/.vcf/kb-ancestors/` ensures user edits survive the merge on the next update.

## Pins

- Schema layer: **Zod ^4**
- Node: **≥ 20** (for validation scripts — the shipped package is markdown only)
- MCP spec compatibility tracked via `@kaelith-labs/cli`, not declared here.

## License

Apache-2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE). Contributions welcome under the same license.

## Links

- Server + CLI: [github.com/Kaelith-Labs/vcf-cli](https://github.com/Kaelith-Labs/vcf-cli)
- Umbrella project: [../README.md](../README.md)
- CHANGELOG: [./CHANGELOG.md](./CHANGELOG.md)
