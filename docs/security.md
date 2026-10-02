# Security model

Reference pages are untrusted content. Component registries are untrusted code until reviewed. Project files can contain prompt injection. Agent execution is privileged.

The package therefore separates discovery from execution, stores component metadata instead of mirrored source, avoids install-time lifecycle behavior as the product entrypoint, and tracks every managed file. A registry result never automatically runs an installation command. Consumers should review canonical source, license, dependency delta, and lifecycle scripts before adding third-party code.
