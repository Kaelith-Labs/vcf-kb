import { describe, it, expect } from "vitest";
import {
  PrimerFrontmatter,
  BestPracticeFrontmatter,
  LensFrontmatter,
  StageFrontmatter,
  ReviewerConfigFrontmatter,
  StandardFrontmatter,
  FrontmatterByType,
} from "../src/frontmatter.js";

describe("PrimerFrontmatter", () => {
  it("accepts the seed MCP primer shape", () => {
    const ok = {
      type: "primer",
      primer_name: "mcp",
      category: "tools",
      version: "2.0",
      updated: "2026-04-18",
      status: "draft-v2",
    };
    expect(PrimerFrontmatter.parse(ok).primer_name).toBe("mcp");
  });

  it("rejects missing type", () => {
    expect(PrimerFrontmatter.safeParse({ primer_name: "x" }).success).toBe(false);
  });

  it("rejects non-lowercase-kebab tags", () => {
    const bad = {
      type: "primer",
      primer_name: "x",
      category: "tools",
      version: 1,
      updated: "2026-01-01",
      tags: ["BadTag"],
    };
    expect(PrimerFrontmatter.safeParse(bad).success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const bad = {
      type: "primer",
      primer_name: "x",
      category: "tools",
      version: 1,
      updated: "2026-01-01",
      extra: true,
    };
    expect(PrimerFrontmatter.safeParse(bad).success).toBe(false);
  });
});

describe("StageFrontmatter", () => {
  it("accepts a Stage-1 code review entry", () => {
    const ok = {
      type: "review-stage",
      review_type: "code",
      stage: 1,
      stage_name: "fake-complete",
      version: 0.1,
      updated: "2026-04-18",
    };
    expect(StageFrontmatter.parse(ok).stage).toBe(1);
  });

  it("rejects stage > 9", () => {
    expect(
      StageFrontmatter.safeParse({
        type: "review-stage",
        review_type: "code",
        stage: 10,
        stage_name: "x",
        version: 1,
        updated: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("FrontmatterByType dispatch", () => {
  it("covers every declared kind", () => {
    expect(Object.keys(FrontmatterByType).sort()).toEqual(
      ["primer", "best-practices", "lens", "review-stage", "reviewer-config", "standard"].sort(),
    );
  });

  it("schemas all parse a known-good object of their type", () => {
    expect(() => StandardFrontmatter.parse({
      type: "standard",
      standard_name: "co",
      version: 0.1,
      updated: "2026-04-18",
    })).not.toThrow();
    expect(() => ReviewerConfigFrontmatter.parse({
      type: "reviewer-config",
      reviewer_type: "code",
      version: 0.1,
      updated: "2026-04-18",
    })).not.toThrow();
    expect(() => LensFrontmatter.parse({
      type: "lens",
      lens_name: "security-surface",
      focus: "attack surface",
      version: 1,
      updated: "2026-04-18",
    })).not.toThrow();
    expect(() => BestPracticeFrontmatter.parse({
      type: "best-practices",
      best_practice_name: "mcp",
      category: "ai",
      version: 1,
      updated: "2026-04-18",
    })).not.toThrow();
  });
});
