# Security Policy

Please report security issues privately through the repository security-reporting channel when available rather than opening a public exploit issue.

Agent Design Pack treats remote references and third-party component code as untrusted. The registry is metadata-only and does not automatically execute discovered installation commands. Installer tests use temporary roots. Managed files are hashed so update/uninstall can avoid deleting local modifications.
