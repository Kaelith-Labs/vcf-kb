// Frontmatter Zod schemas for every KB kind.
//
// These are the contract between the KB corpus and the MCP server. Every
// markdown file under kb/<kind>/ must pass the matching schema at load
// time. The server refuses to serve a malformed entry.
//
// Tag/slug shapes are intentionally the same as `@vcf/cli`'s TagSchema so
// the primer tag-matching engine (M3.5) can do pure set operations with no
// normalization per call.

import { z } from "zod";

const Tag = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/, "tags must be lowercase kebab-case");

const IsoDateOrDate = z.union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

export const PrimerFrontmatter = z
  .object({
    type: z.literal("primer"),
    primer_name: z.string().min(1).max(128),
    category: z.string().min(1).max(64),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
    status: z.enum(["draft-v1", "draft-v2", "stable", "deprecated"]).default("draft-v1"),
    tags: z.array(Tag).max(32).default([]),
    last_reviewed: IsoDateOrDate.optional(),
    applies_to: z.array(Tag).max(32).default([]),
  })
  .strict();

export const BestPracticeFrontmatter = z
  .object({
    type: z.literal("best-practices"),
    best_practice_name: z.string().min(1).max(128),
    category: z.string().min(1).max(64),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
    status: z.enum(["draft-v1", "draft-v2", "stable", "deprecated"]).default("draft-v1"),
    tags: z.array(Tag).max(32).default([]),
    last_reviewed: IsoDateOrDate.optional(),
    applies_to: z.array(Tag).max(32).default([]),
  })
  .strict();

export const LensFrontmatter = z
  .object({
    type: z.literal("lens"),
    lens_name: z.string().min(1).max(128),
    focus: z.string().min(1).max(256),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
    tags: z.array(Tag).max(32).default([]),
  })
  .strict();

export const StageFrontmatter = z
  .object({
    type: z.literal("review-stage"),
    review_type: z.enum(["code", "security", "production"]),
    stage: z.number().int().min(1).max(9),
    stage_name: z.string().min(1).max(128),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
    tags: z.array(Tag).max(32).default([]),
  })
  .strict();

export const ReviewerConfigFrontmatter = z
  .object({
    type: z.literal("reviewer-config"),
    reviewer_type: z.enum(["code", "security", "production"]),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
  })
  .strict();

export const StandardFrontmatter = z
  .object({
    type: z.literal("standard"),
    standard_name: z.string().min(1).max(128),
    version: z.union([z.string(), z.number()]),
    updated: IsoDateOrDate,
  })
  .strict();

/** Dispatch helper: pick schema by `type` field. */
export const FrontmatterByType = {
  primer: PrimerFrontmatter,
  "best-practices": BestPracticeFrontmatter,
  lens: LensFrontmatter,
  "review-stage": StageFrontmatter,
  "reviewer-config": ReviewerConfigFrontmatter,
  standard: StandardFrontmatter,
} as const;

export type FrontmatterType = keyof typeof FrontmatterByType;

export type Primer = z.infer<typeof PrimerFrontmatter>;
export type BestPractice = z.infer<typeof BestPracticeFrontmatter>;
export type Lens = z.infer<typeof LensFrontmatter>;
export type Stage = z.infer<typeof StageFrontmatter>;
export type ReviewerConfig = z.infer<typeof ReviewerConfigFrontmatter>;
export type Standard = z.infer<typeof StandardFrontmatter>;
