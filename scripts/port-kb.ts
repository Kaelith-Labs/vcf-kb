// KB port script + drift check.
//
// Two modes, driven by argv:
//   npm run port         → copy from ../docs/ into kb/, preserving
//                          frontmatter byte-for-byte. Overwrites existing
//                          files in kb/.
//   npm run port -- --check → fail if any file in kb/ diverges from its
//                          source in ../docs/. This is the CI gate.
//
// Source mapping (extend as M9 adds more content):
//   docs/primers/MCP-PRIMER.md          → kb/primers/mcp.md
//   docs/primers/Vibe-Coding-PRIMER.md  → kb/primers/vibe-coding.md
//
// Hand-authored files (not ported; edited directly in kb/):
//   kb/standards/*.md
//   kb/reviewers/*.md
//   kb/review-system/**/*.md

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DOCS_ROOT = resolve(REPO_ROOT, "..", "docs");
const KB_ROOT = resolve(REPO_ROOT, "kb");

interface PortEntry {
  source: string; // absolute path under docs/
  target: string; // absolute path under kb/
}

const PORT_MAP: PortEntry[] = [
  {
    source: resolve(DOCS_ROOT, "primers", "MCP-PRIMER.md"),
    target: resolve(KB_ROOT, "primers", "mcp.md"),
  },
  {
    source: resolve(DOCS_ROOT, "primers", "Vibe-Coding-PRIMER.md"),
    target: resolve(KB_ROOT, "primers", "vibe-coding.md"),
  },
];

async function sha(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function runCheck(): Promise<number> {
  let drift = 0;
  for (const e of PORT_MAP) {
    if (!(await fileExists(e.source))) {
      process.stderr.write(`port-kb: source missing: ${e.source}\n`);
      drift++;
      continue;
    }
    if (!(await fileExists(e.target))) {
      process.stderr.write(`port-kb: target missing (run "npm run port"): ${e.target}\n`);
      drift++;
      continue;
    }
    const [sh1, sh2] = await Promise.all([sha(e.source), sha(e.target)]);
    if (sh1 !== sh2) {
      process.stderr.write(`port-kb: drift between\n  ${e.source}\n  ${e.target}\n`);
      drift++;
    }
  }
  return drift;
}

async function runCopy(): Promise<void> {
  for (const e of PORT_MAP) {
    const buf = await readFile(e.source);
    await writeFile(e.target, buf);
    process.stderr.write(`port-kb: copied ${e.source} -> ${e.target}\n`);
  }
}

const mode = process.argv.includes("--check") ? "check" : "copy";

if (mode === "check") {
  const drift = await runCheck();
  if (drift > 0) {
    process.stderr.write(`port-kb: ${drift} drift(s) detected\n`);
    process.exit(1);
  }
  process.stderr.write("port-kb: no drift\n");
} else {
  await runCopy();
}
