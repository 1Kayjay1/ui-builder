# Adapter development

An adapter must define a verified skill target and detection signals. Detection confidence should combine executable presence, a successful version command, and known configuration paths rather than treating one directory as proof.

Current adapters:

- Codex: project/user `.agents/skills`
- Claude Code: project/user `.claude/skills`

New adapters must use documented paths from current primary sources, avoid overwriting shared instruction/config files, add lifecycle tests, and expose uncertainty in `doctor` instead of guessing. Rich plugin/MCP/hook integration may be added when the mechanism is verified; the portable skill core remains authoritative.
