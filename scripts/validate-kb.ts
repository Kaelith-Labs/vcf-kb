// Frontmatter validation across the whole KB tree.
//
// Walks kb/, for every *.md picks the schema by dir convention (primers/,
// best-practices/, lenses/, reviewers/, standards/, review-system/) and
// validates. Fails with a non-zero exit code if any file doesn't match.
// Called by CI via `npm run validate:kb`.

import { readdir, readFile } from "node:fs/promises";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { FrontmatterByType, type FrontmatterType } from "../src/frontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const KB_ROOT = resolve(REPO_ROOT, "kb");

/** Map a kb-relative dir path to the expected frontmatter `type` value. */
function typeForPath(relPath: string): FrontmatterType | null {
  const parts = relPath.split(/[\\/]/);
  const top = parts[0];
  switch (top) {
    case "primers":
      return "primer";
    case "best-practices":
      return "best-practices";
    case "lenses":
      return "lens";
    case "reviewers":
      return "reviewer-config";
    case "standards":
      return "standard";
    case "review-system":
      return "review-stage";
    default:
      return null;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(full);
    else if (ent.isFile() && ent.name.endsWith(".md")) yield full;
  }
}

let errors = 0;

for await (const full of walk(KB_ROOT)) {
  const rel = relative(KB_ROOT, full);
  const expectedType = typeForPath(rel);
  if (expectedType === null) {
    // Files in the root of kb/ (e.g. .gitkeep) are fine; only flag unknown *.md dirs.
    process.stderr.write(`validate-kb: skip (unknown dir): ${rel}\n`);
    continue;
  }
  const raw = await readFile(full, "utf8");
  const fm = matter(raw).data;
  if ((fm as { type?: string }).type !== expectedType) {
    process.stderr.write(
      `validate-kb: ${rel} — frontmatter.type="${(fm as { type?: string }).type}" but dir implies "${expectedType}"\n`,
    );
    errors++;
    continue;
  }
  const schema = FrontmatterByType[expectedType];
  const result = schema.safeParse(fm);
  if (!result.success) {
    process.stderr.write(`validate-kb: ${rel} — schema violation:\n`);
    for (const issue of result.error.issues) {
      process.stderr.write(`  - ${issue.path.join(".")}: ${issue.message}\n`);
    }
    errors++;
  }
}

if (errors > 0) {
  process.stderr.write(`validate-kb: ${errors} file(s) failed validation\n`);
  process.exit(1);
}
process.stderr.write("validate-kb: all KB files pass frontmatter schema\n");
