---
name: API dependency installation
description: Notes about installing this workspace's API server dependencies in Replit.
---

When the Replit package firewall blocks a transitive dependency, first check whether the direct parent has a newer release that requires the patched dependency. For the API server's Express stack, updating Express resolved the blocked `proxy-addr` dependency without replacing Express or adding an override. Do not bypass the firewall or install packages from an alternate registry.

The workspace also enforces a 24-hour package maturity window. If an urgent, trusted release is younger than that, any exception should target only the exact package version; remove it after updating the lockfile, then verify a frozen install with the normal policy restored.

**Why:** The API server was blocked by an outdated transitive version, while the newest Express release was initially stopped by the separate maturity rule. Updating the upstream package fixed the dependency path and the service subsequently started normally.

**How to apply:** Before verifying API changes, confirm the dependency tree installs from the lockfile and the API health endpoint responds. When a package is blocked, inspect its parent dependency before considering overrides or exceptions.
