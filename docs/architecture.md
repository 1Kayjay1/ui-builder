# Architecture

Agent Design Pack has one authoritative skill/knowledge core and thin agent adapters. The installer compiles the same skill directories into the target agent's supported skill location instead of maintaining divergent prompts.

## Layers

1. **Workflow skills** decide process and judgment.
2. **Knowledge modules** are loaded progressively.
3. **Project intelligence** stores inferred and explicit design DNA in `.design/`.
4. **Deterministic tools** analyze files, search registry metadata, and audit rendered pages.
5. **Agent adapters** place the core into verified skill paths.

The initial package stays single-package for release simplicity. Internal modules are separated so analyzer/audit/registry/adapters can become workspace packages later without changing the product model.

## Ownership

`.designpack/` is installer/tool state. `.design/` is project design data. Agent skill copies are managed files tracked by checksum. Uninstall removes unchanged managed files only.
