---
name: API dependency installation
description: Notes about installing this workspace's API server dependencies in Replit.
---

Installing the frontend and API-spec workspaces with a targeted pnpm filter succeeds, but installing the API server has been blocked by a Replit package-firewall 403 while fetching transitive `proxy-addr@2.0.7`. Do not bypass the firewall with direct registries or manual package copies; check whether a supported newer dependency path resolves the block.

**Why:** The API workflow can fail before serving even when frontend typechecking passes, so UI checks alone do not confirm the API-backed feature works end to end.

**How to apply:** Before verifying API changes in this project, confirm the API server's dependencies are installed and its health endpoint responds. If installation is still blocked, report that limitation rather than claiming runtime verification.
