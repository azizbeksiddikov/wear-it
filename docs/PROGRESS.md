# Wearit — progress

Full-stack online fashion store. Live: https://wearit.azbek.me · admin: https://wearit.admin.azbek.me (Contabo VPS, Cloudflare DNS).

| Part | Repo | Local folder |
|---|---|---|
| Backend + admin (Express, EJS views, MongoDB) | https://github.com/azizbeksiddikov/wear-it | `wear-it/` |
| Frontend (React, MUI, Redux, Vite) | https://github.com/azizbeksiddikov/wear-it-react | `wear-it-react/` |

Rename details: [RENAME-WEARIT.md](RENAME-WEARIT.md). This file lives in the backend repo (`docs/`) and covers both repos.

## Tasks

| Status | Task | Notes |
|---|---|---|
| done | Brand text changed to "Wearit" (visible text only) | Branch `rename-wearit` in both repos, builds pass |
| todo | Review and merge `rename-wearit` into master, then redeploy | Needs owner approval; VPS runs master only |
| todo | Owner's manual check of the live shop | Part of the pre-application check |
| todo | Restore live links on the portfolio | After the resume is approved |
| skipped | Bigger rename (GitHub repos, container names, server folders, local folders) | Owner decision 2026-10-21. Steps are in RENAME-WEARIT.md if it comes back |
| skipped | Namecheap domain auto-renew | Owner decision |
| later | `npm ci` in `wear-it-react` (the macOS rollup binary is missing) | Only needed to build locally |
