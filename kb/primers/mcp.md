---
type: primer
primer_name: mcp
category: tools
version: 2.0
updated: 2026-04-18
status: draft-v2
---

# MCP Primer

## What This Primer Is For

This primer prepares a planner to design a Model Context Protocol (MCP) server or integration without trapping the project in vendor-specific assumptions, unsafe tool surfaces, or token-hemorrhaging contracts.

It is relevant when a project:
- exposes functionality to LLM clients through MCP
- needs to run under more than one client (Claude Code, Codex CLI, Gemini CLI, Cursor, etc.)
- wires agents into files, APIs, or local capabilities with durable state
- must stay disciplined about trust, scope, and token economy

Its purpose is to make planning decisions explicit before they calcify into code.

---

## Read This First

MCP is an open JSON-RPC 2.0 protocol that lets a host application connect an LLM to external tools, data, and prompt templates through a uniform client/server contract. As of the **2025-11-25** spec revision, stdio and **Streamable HTTP** are the two supported transports; the older HTTP+SSE transport was deprecated in the 2025-03-26 spec and is kept only for backward compatibility. The reference TypeScript SDK (`@modelcontextprotocol/sdk`, current 1.x) is production-grade; a v2 is in pre-alpha and is not yet the recommended target.

The protocol itself is small. The discipline is in what you expose and how.

The most common mistake is treating MCP like a convenience layer — "let me put all my internal tools on it" — instead of treating it as a **trust boundary and token contract**. When that happens systems drift into:
- unclear authority (everything a tool can do, the LLM can now do)
- excessive capability exposure (tools that are useful once but loaded forever)
- tool overlap and routing ambiguity
- context bloat (tools that return tens of thousands of tokens by default)
- hidden state the client can neither see nor audit
- client-specific assumptions ("it works in Claude Code") leaking into the server

A good MCP design starts strict and earns its surface.

---

## What MCP Actually Is (one paragraph)

An MCP **host** (e.g. Claude Code) runs one or more **clients**, each of which connects to a **server**. The server exposes three primitives — **tools**, **resources**, and **prompts** — over JSON-RPC 2.0. Capabilities are negotiated at initialization; transports are stdio (for local subprocess servers) or Streamable HTTP (for remote/hosted servers). Clients can optionally offer back sampling (let the server ask the LLM for completions), roots (tell the server which directories it may touch), and elicitation (let the server prompt the user). The protocol specifies framing, not semantics — the server still owns every decision about what tools mean, what inputs are valid, and what side effects happen.

---

## Tools vs. Resources vs. Prompts

Pick the right primitive per job. Mixing them blurs intent and wastes context.

- **Tools** — functions the model can invoke. Use for *verbs with side effects or fresh computation*: run a test, write a file, query a DB, prepare a review package. Model-driven; client asks the user before calling; inputs are JSON-schema validated.
- **Resources** — identifiable data the client can read. Use for *nouns*: a document at a path, a DB row, a rendered config. Resources are cheap to list, lazy to read, and referenced by URI. Prefer resources over tools when the thing is "a file to show," not "a thing to do."
- **Prompts** — parameterized message templates the user (via the client UI) can invoke. Use for *workflow recipes* the user selects consciously — e.g. "draft-release-notes." Prompts are user-selected, not model-selected.

Heuristic: if the LLM should decide when to call it, it's a tool. If the user should pick it, it's a prompt. If it's "show me this data," it's a resource.

---

## Why an LLM-Agnostic Surface Matters

Claude Code, Codex, Gemini CLI, Cursor, Windsurf, and the major IDE agents all speak MCP. Skill/prompt surfaces are vendor-specific; MCP is the shared denominator. Building on MCP:
- lets the same server power multiple clients without per-client rewrites
- lets you swap models per stage (cheap local model for mechanical work, cloud model for judgment)
- insulates the project from any one vendor's pricing or policy move
- keeps client-specific trigger logic (slash commands, phrase matching) in client-side skill packs, not in the server

The planner's job is to keep the server **generic**. Never let `if (client === "claude-code")` creep into tool logic.

---

## Transport Choice (planner-level)

- **stdio** is the default for local servers launched as subprocesses. Fast, trivially secure (no network surface), no auth needed, client owns lifecycle. This is what Claude Code, Codex CLI, Gemini CLI, and Cursor use by default. Pick stdio unless you have a reason.
- **Streamable HTTP** (spec 2025-03-26+) is for remote/hosted servers. Stateless-friendly, horizontally scalable, supports resumable streams. This is the target for multi-user or cloud-hosted MCP servers. Expect auth (OAuth is the common path) and rate limiting.
- **HTTP+SSE** is deprecated. Do not target it for new work; support it only if you must serve legacy clients.

If the server is "a local dev tool," choose stdio and stop thinking about it. If the server is a hosted service, choose Streamable HTTP and design auth, session, and idempotency up front.

---

## Scope and Launch Model

Clients discover servers through a `.mcp.json`-style configuration. Scope is a **planner decision**, not an implementation detail:

- **Global (user) scope** — the server loads in every session. Use for tools that are always relevant (note capture, search, small always-on utilities).
- **Project (workspace) scope** — the server loads only when the user opens a specific project. Use for lifecycle-heavy tooling that would be noise elsewhere.
- **Local scope** — the server is private to a single workspace and not checked in. Use for experiments and secrets.

For VCF-MCP specifically: the project locks a two-scope model — global (idea/spec/project-init/catalog) plus project (full lifecycle, auto-wired by `vcf init` writing a project-local `.mcp.json`). This keeps uninitialized instances clean and initialized projects fully capable. Plan scope partitioning *before* writing tool definitions; moving a tool across scopes later is a breaking change.

---

## Security Boundaries the Planner Must Design

MCP gives the LLM real capability, so the server inherits real risk. Recent (2025-2026) incidents — prompt-injection tool poisoning, path-traversal in the official filesystem server, `NeighborJack` where servers bound `0.0.0.0` with no auth, the `mcp-remote` OAuth CVE, and the Supabase service-role support-ticket exfiltration — all trace back to planning-level oversights.

Design up front:
- **Filesystem scope.** What directories may the server read/write? Symlinks resolved and re-validated. No `..` honored.
- **Secret handling.** Secrets live in env vars (with `${VAR}` interpolation in config), never in tool outputs, never in log lines. Redact before any outbound network call.
- **Endpoint trust levels.** If the server calls external LLMs, categorize endpoints (local / private-cloud / public). Sensitive code reviews pin to trusted endpoints.
- **Input is data, not instruction.** Tool inputs that fetch third-party content (issues, PRs, tickets) can carry injected instructions. The server must not re-feed that content straight into its own LLM calls without marking it as untrusted data.
- **Confirmation for destructive work.** Return a plan; make the client request explicit approval before `ship`, `delete`, `publish`, etc. Tools should not auto-execute destructive work just because the model called them.
- **No ambient network.** The server talks only to configured endpoints. No telemetry, no auto-update.

---

## Token Economy (design-level)

Token cost is a design concern, not a tuning knob. Decide early:

- **Default to paths + summaries.** Tools return `{ paths, summary, expand_hint }` by default. `expand=true` pulls content. This is the single biggest lever; a tool that returns a 50k-line file "because the model might need it" ruins every downstream turn.
- **Scope by diff, not tree.** Review, test, ship flows should operate on what changed, not the whole project.
- **Stop-on-first-fail.** Staged pipelines (review stages, audit passes) return the first failing stage + evidence, not every result.
- **Lazy resources.** Expose artifacts as resources so the client can fetch them on demand instead of pre-loading.
- **Prefer SQLite/index lookups over filesystem walks.** Indexes are O(1); walks grow with the repo.

Cheap tools with explicit expansion beat "helpful" tools that pay upfront.

---

## When NOT to Use MCP

MCP is not a replacement for:

- **CLIs.** If a human or CI runs it deterministically, it's a CLI command. Maintenance (reindex, stale-check, endpoint-register, audit dump) belongs on a CLI, not on an MCP tool. MCP tools are for LLM-in-the-loop paths.
- **HTTP APIs.** If another program (not an LLM) is the caller, MCP adds ceremony. Ship a REST or gRPC API.
- **Libraries.** If the consumer is running inside the same process, just expose a function.
- **RPC between backend services.** Use the right inter-service protocol.
- **Fast, deterministic transforms at scale.** MCP is chatty and LLM-paced; batch jobs belong elsewhere.

Rule of thumb: expose something via MCP **only if an LLM choosing to call it is the value**. Otherwise the MCP surface is overhead.

---

## Compatibility and Versioning

- The MCP spec is still moving. Major revisions landed in 2024-11-05, 2025-03-26, and 2025-11-25. Track the protocol version string; don't assume features exist.
- Pin SDK versions (e.g. `@modelcontextprotocol/sdk` ^1.29). The v2 TypeScript SDK is pre-alpha as of April 2026 and is not yet the recommended target; v1 continues to receive bug/security fixes for at least six months after v2 ships.
- Client capabilities vary. Not every client implements sampling, elicitation, or resource subscriptions. Degrade gracefully when a client says "no."
- Your server's own tool schema is a public contract. Breaking changes need a major version bump and a deprecation window.

---

## Common Pitfalls to Steer Around

- **Tool overload.** Twelve tools that do similar things with different arguments. Consolidate. Clients only have so much context for tool descriptions.
- **Mutable templates.** Reviewer/planner templates that the server edits in place. Use disposable copies.
- **Auto-execution of destructive work.** `ship_release` that cuts a tag the moment the model calls it. Split into prepare/confirm/execute.
- **Client-specific server logic.** The server detects "are we in Claude Code" and branches. Wrong place — push client logic to skill packs.
- **Server-side natural-language triggers.** The server tries to match phrases like "capture this idea." That's the client's trigger surface. Servers expose tools; clients map triggers to tool calls.
- **Hidden state.** Tools that mutate SQLite or config without returning what changed.
- **Giant default outputs.** Tool returns the whole repo tree or full review history by default.
- **Stdout in stdio mode.** Any non-protocol byte on stdout breaks the transport. This is an implementation detail the planner must bake into the design ("all logs go to stderr").
- **Ignoring cancellation and progress.** Long-running tools that the client cannot cancel or monitor.
- **No audit trail.** You cannot answer "what tool ran, with what inputs, against what endpoint, at what time."

---

## What To Decide Before You Start

1. **Primitive per job.** Each capability: tool, resource, or prompt? Justify it.
2. **Transport.** Stdio for local; Streamable HTTP for hosted. Pick one; don't try to support both in MVP.
3. **Scope model.** Global vs. project vs. local. Draw the line before writing tools.
4. **Trust boundaries.** Allowed roots, endpoint trust levels, redaction policy, destructive-action gating.
5. **Token-economy contract.** Default output shape; when `expand=true` is allowed; what "failure" returns.
6. **Client-agnostic surface.** What the tool names, inputs, and outputs are — independent of any one client.
7. **Versioning plan.** SDK pin, spec version, your own server semver strategy.
8. **Audit and logging.** What every tool call writes, where, with what redaction.

---

## When To Open The Best-Practice Docs

Open the **MCP Best Practices** doc when you move from deciding to building:
- choosing schema patterns and writing Zod validators
- shaping error envelopes and JSON-RPC error codes
- implementing progress, cancellation, streaming
- wiring stdio/Streamable HTTP transports
- publishing to npm with provenance and dual bins
- writing parity tests across clients

This primer is the discipline layer. The best-practices doc is the mechanics.

---

## Related Best Practices

Primary follow-up docs:
- MCP Best Practices
- LLM Integration Best Practices
- Security Best Practices
- Automated Agents Best Practices
- Library / SDK Best Practices (for publishing patterns)
- Prompt & Model Economics Best Practices

---

## Quick Routing Guide

This primer is especially important when:
- building a multi-client LLM tool integration
- exposing workflow state (lifecycle, reviews, builds) to agents
- publishing an MCP server to npm or a registry
- designing permission and audit boundaries for agent actions

It commonly pairs with:
- LLM Integration
- Security
- Automated Agents
- Versioning & Migration

---

## Final Standard

Before designing an MCP server, you should be able to say:

> I know which primitive each capability is, which transport and scope it launches under, what authority it grants, what its default output looks like, which clients I need to support generically, how it fails safely, how it is versioned, and what its audit trail is.

If you cannot say that honestly, the MCP surface is not ready to design.
