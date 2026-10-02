# Agent Design Pack

Agent Design Pack is an installable design-engineering capability layer for coding agents. It combines small workflow skills, progressive design knowledge, project design memory, deterministic analysis, a rights-aware component metadata registry, and browser QA.

It is not a CSS framework and not a giant “make it pretty” prompt. Its design rule is simple: **judgment belongs in skills; deterministic work belongs in tools.**

## Quick start

```bash
npx agent-design-pack init --agents codex,claude
```

Until the package is published, build the repository and invoke the packed/local CLI:

```bash
npm install
npm test
npm run build
node dist/cli.js init --agents codex,claude --project /path/to/project --yes
```

The installer writes only pack-owned skill/core files. It does not rewrite an existing `AGENTS.md`, `CLAUDE.md`, or other unrelated configuration. Project design memory is created under `.design/` and deliberately survives uninstall.

## Supported agents

Current implemented adapters:

| Agent | Project skill target | Status |
|---|---|---|
| OpenAI Codex | `.agents/skills/<skill>/SKILL.md` | Implemented portable skill target |
| Claude Code | `.claude/skills/<skill>/SKILL.md` | Implemented native skill target |

Other adapters described by the research blueprint are roadmap items, not claimed as supported.

## Commands

```text
designpack                 same as init
designpack init            install skills/core and generate initial project design memory
designpack add             alias for init
designpack update          update pack-owned files; conflicts stop instead of overwriting local edits
designpack doctor          verify receipt, hashes, registry, profile, and agent skill roots
designpack uninstall       remove only unchanged pack-owned files
designpack profile         analyze a project and create .design artifacts
designpack components ...  search the metadata-only component/effect registry
designpack audit <url>     capture representative viewports and run layout + axe checks
```

Useful installer flags: `--project`, `--agents codex,claude`, `--global`, `--dry-run`, `--yes`, `--force`, `--json`.

`--force` does not mean “delete first.” Conflicting files are backed up before replacement.

## Design workflows

Seven compact skill front doors are shipped:

- `design-init`
- `design-build`
- `design-extend`
- `design-match`
- `design-polish`
- `design-audit`
- `design-research`

Detailed design theory lives in progressively loaded knowledge modules instead of being duplicated into every skill. Modules cover taste, typography, color, tokens, layout, responsive design, components, interaction, micro-interactions, application-state integrity, motion, accessibility, performance, visual QA, research, security, licensing, polish, shaders, 3D, and particles.

## Project intelligence

`designpack profile` performs static, read-only analysis of the project. It detects framework/package manager, styling systems, component and motion libraries, candidate routes/assets, CSS variables, and repeated colors/spacing/radii/type/shadow/motion values. It records uncertainty rather than pretending static analysis can judge rendered hierarchy.

The generated design memory is:

```text
.design/
  design-profile.json
  tokens.json
  references.json
```

These files are project data, not disposable installer internals.

## Visual QA

`designpack audit <url>` prefers Playwright Core + axe-core when those optional packages are available. It also ships a zero-dependency Chromium DevTools Protocol fallback for capture and core measurable checks. It captures:

- 360×800
- 390×844
- 768×1024
- 1280×800
- 1440×900
- 1920×1080

For each viewport it records a screenshot, HTTP status, horizontal overflow, offscreen interactive controls, duplicate IDs, console errors, failed requests, and WCAG-oriented axe violation groups. Chromium, Chrome, or Edge must already be installed. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when auto-detection cannot find it. The CDP fallback performs basic accessible-name checks; install the optional Playwright/axe dependencies for the fuller axe gate.

The dimensions are QA representatives, not CSS breakpoint commandments.

## Component/effect registry

The registry stores metadata, not mirrored third-party source. Search example:

```bash
designpack components "shader background" --framework react
```

Records include source, capabilities, framework, dependencies, license/redistribution status, canonical retrieval path, accessibility risk, performance tier, visual tags, and verification date. React Bits is intentionally referenced rather than bundled because the researched license restricts redistribution of the component collection.

## Installation safety model

Each installation receives a receipt with package version, scope, installed adapters, managed file hashes, backups, and generated project artifacts. The core invariants are:

1. An existing unrelated config file is not overwritten.
2. A second install is idempotent.
3. A changed managed file becomes a conflict unless `--force` is explicit.
4. Forced replacements are backed up first.
5. Uninstall deletes only files whose checksum still matches the installer receipt.
6. `.design/` survives uninstall.

Remote design references and registry code are treated as untrusted. Discovery never implies execution.

## Architecture

This initial release is one publishable TypeScript package rather than a premature public monorepo. The logical layers are still separated:

```text
workflow skills
    ↓
progressive knowledge
    ↓
project intelligence
    ↓
deterministic tools
    ↓
agent adapters
```

See `docs/architecture.md` and `docs/adapter-development.md`.

## Development

Requirements: Node 20.11+.

```bash
npm install
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

Tests use temporary projects and do not touch real agent configuration. The Playwright smoke test runs only when a local `/usr/bin/chromium` is available; the production audit command also supports installed Chrome/Edge or an explicit executable path.

## Publishing

The package is prepared for public npm publishing but is not automatically published by this repository. The package name must be rechecked for npm/trademark conflicts immediately before first release. CI includes a provenance-friendly release workflow using npm trusted publishing/OIDC after repository/npm configuration is completed.

## Contributing

See `CONTRIBUTING.md`. Changes to skills should stay concise and push detailed theory into knowledge modules. Changes to registry records must preserve provenance and license/security metadata.

## Roadmap

Near-term: Gemini/Cursor/Copilot adapters, richer computed-style extraction, reference connectors with source-policy records, Figma structured input, remote registry metadata updates, and benchmark automation. Advanced shader/3D registries and long-term taste learning remain later work until the core demonstrates measurable value.

## Benchmark harness

`npm run benchmark` runs the same configured agent/model command against three representative tasks in isolated workspaces, once without the pack and once after installing it. Set `BASELINE_CMD` and `PACK_CMD` to equivalent agent invocations; the runner supplies `DESIGNPACK_EVAL_PROMPT`, `DESIGNPACK_EVAL_CASE`, and `DESIGNPACK_EVAL_MODE`, and writes structured results for comparison. This keeps model choice outside the package while making the A/B procedure reproducible.
