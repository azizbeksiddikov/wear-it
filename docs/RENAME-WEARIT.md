# Rename to "Wearit" — report (2026-10-21)

Brand decided: **Wearit**. This pass changed only user-visible text. Nothing was pushed, merged or deployed, and nothing on the server was touched.

Both repos got a branch `rename-wearit` from `develop`. It was later merged into `master` (backend merge `4559f11`, frontend `6a9fa06`), and `master` is now the only deployed branch.

No admin frontend repo exists. The admin panel is the EJS views inside the backend and is covered below.

## What changed

### Backend `wear-it` — commit `453eaa0` on `rename-wearit`
| File | Change |
|---|---|
| `README.md` | Title "Wear-It Backend" → "Wearit Backend"; overview "**Wear-It**" → "**Wearit**" |
| `src/app.ts` | `/` landing page `<title>` + `<h1>` "Wear It API" → "Wearit API" |
| `src/views/includes/header.ejs` | Admin `<title>` "WearIt Admin" → "Wearit Admin" |
| `src/views/includes/navbar.ejs` | Admin navbar brand "WearIt" → "Wearit" |
| `package.json` | `description` only → "Backend for the Wearit e-commerce platform" (`name` unchanged: `wear-it`) |

This repo has no Swagger setup, no email templates and no i18n files that mention the brand.

Build: `tsc --noEmit` passes. No env values were needed.

### Frontend `wear-it-react` — commit `0ded62c` on `rename-wearit`
| File | Change |
|---|---|
| `index.html` | `<title>` → "Wearit \| Discover Your Style"; meta description, keywords (`wearit`), author "Wearit Team", og:title, twitter:title |
| `public/manifest.json` | `name` → "Wearit"; added `short_name: "Wearit"` |
| `src/app/components/headers/Navbar.tsx` | Logo text → "Wearit" |
| `src/app/components/footer/index.tsx` | Footer brand link + "© … Wearit. All rights reserved." |
| `src/app/components/auth/index.tsx` | Modal title "Join Wearit" |
| `README.md` | Title and prose → "Wearit" |

Build: `npm run build` (`tsc && vite build`) passes. The worktree has no env file, so Vite used the built-in fallback API URL.
- Note: the main checkout's `node_modules` only has Linux rollup binaries (`@rollup/rollup-linux-arm64-*`), so `vite build` fails on the Mac with that folder ("Cannot find module @rollup/rollup-darwin-arm64"). This problem was already there and is not caused by the rename. A fresh `npm ci` inside the worktree built fine. To build locally in the main folder, run `rm -rf node_modules && npm ci`.

### Docs (not in git)
- `2-tech/vps-setup.md`: title "Eventify + Wear-it" → "Eventify + Wearit"; product mentions in the done-list (lines ~37, 38, 45, 58) → "Wearit"; the Naming TODO is marked done and points here. Paths, repo names, container names and commands were not changed.
- `1-wear-it/sample-images/migrate-supabase.js`: first comment line "Wear-it's" → "Wearit's" (comment only).
- The repo READMEs are covered by the commits above. There were no other notes or READMEs in `1-wear-it/`.

### Not changed on purpose (would break prod or isn't brand text)
- Docker images and containers: `wear-it-backend:prod`, `wear-it-backend-prod`, `wear-it-react-prod`, `wearit-react:prod`, and the dev variants. Deploy scripts and compose service names are also unchanged.
- Ports, env var names, MongoDB DB `WearIt`, Supabase buckets (`products`, `members`), API routes and fields.
- The `package.json` `name` fields (`wear-it` and `wearit-react`), git remotes and folder names.
- Domains (`wearit.azbek.me`, `wearit.admin.azbek.me`) and nginx confs.
- Favicon path `/wear-it.ico`. It is a file path, not visible text. It could be renamed later, but browsers cache favicons, so this is low value.
- The README lines `docker build -t wear-it-backend .` and the `wear-it-backend/` structure tree. These are commands and paths.
- `env.example` files were not opened.

### To ship this
1. Review: `git -C wear-it diff develop..rename-wearit` (and the same in `wear-it-react`).
2. Merge `rename-wearit` → `develop` (→ `master` if that is the deploy branch), push.
3. On the VPS run `git pull` in `/opt/apps/wear-it*`, then the usual `deploy_prod.sh`. Container names stay the same, so nginx and the backup script need no changes.

---

## Plan for the bigger rename later (not executed)

Goal names: repos `wearit-api` (backend) and `wearit-web` (frontend). Server paths `/opt/apps/wearit-api` and `/opt/apps/wearit-web`. Containers/images `wearit-api-prod` / `wearit-api:prod` and `wearit-web-prod` / `wearit-web:prod`. Local folders to match.

Do it in a quiet window. Expect about 1–2 minutes of downtime per app. Keep the old containers' images until the new ones are verified.

### Step 0 — Prepare
1. Make a fresh backup: `2-tech/server-backup/backup.sh`. Also write down `docker ps` and `docker images` on the VPS.
2. Make sure both repos are clean and pushed, and that the `rename-wearit` branch is merged.

### Step 1 — GitHub repo rename (safe; GitHub redirects old URLs)
1. GitHub → `azizbeksiddikov/wear-it` → Settings → Rename → `wearit-api`. Rename `wear-it-react` → `wearit-web`.
2. Point the remotes at the new names so you don't depend on redirects:
   - Locally: `git -C <backend> remote set-url origin https://github.com/azizbeksiddikov/wearit-api`, and the same for the frontend with `wearit-web`.
   - On the VPS: the same `set-url` in `/opt/apps/wear-it` and `/opt/apps/wear-it-react`.
3. What could break: redirects stop working if a new repo is ever created with an old name. Also update any links to the old names: portfolio site, resume, other READMEs, and the Vercel/GitHub Actions integrations, if any.

### Step 2 — Container and image names (code change, then redeploy)
1. In a branch, change:
   - backend `deploy_prod.sh` / `deploy_dev.sh`: `wear-it-backend-prod` → `wearit-api-prod`, `wear-it-backend:prod` → `wearit-api:prod` (and the dev ones)
   - backend `docker-compose*.yml` `container_name`
   - frontend `docker-compose.prod.yml` / `.dev.yml`: service + `container_name` `wear-it-react-prod` → `wearit-web-prod`, `image: wearit-react:prod` → `wearit-web:prod`
   - frontend `deploy_prod.sh` / `deploy_dev.sh`: `IMAGE_NAME` and the `grep` / `--filter name=` checks
   - README commands
2. Important: the new deploy scripts only stop and remove containers with the **new** names. The old containers would keep running and hold ports 3003/3000, and the new container fails with "port is already allocated". So before deploying, stop the old ones by hand on the VPS:
   - backend: `docker stop wear-it-backend-prod && docker rm wear-it-backend-prod`
   - frontend: `cd /opt/apps/wear-it-react && docker compose -f docker-compose.prod.yml down` **before** pulling the new compose file. After the pull, the service name changes and `down` would no longer find the old container. If you missed this, use `docker rm -f wear-it-react-prod`.
3. Deploy with `deploy_prod.sh`, then check: `docker ps`, `curl -I https://wearit.azbek.me`, `curl -I https://wearit.admin.azbek.me`, and test an admin login plus an image upload.
4. Clean up: `docker rmi wear-it-backend:prod wearit-react:prod`.
5. What could break: nginx is not affected, because it proxies to `127.0.0.1:3000/3003`, not to container names. Check this with `grep proxy_pass /etc/nginx/sites-enabled/*`. Any monitoring, cron or healthcheck that uses the old container names would break. `backup.sh` reads logs from all containers via `docker ps`, so it is fine.

### Step 3 — Server paths `/opt/apps/wear-it*`
1. After step 2 works, stop both apps (`docker stop wearit-api-prod wearit-web-prod`).
2. Run `mv /opt/apps/wear-it /opt/apps/wearit-api && mv /opt/apps/wear-it-react /opt/apps/wearit-web`. The server env files move with the folders. The backend's `deploy_prod.sh` mounts `$(pwd)/.env`, so it follows the new path.
3. Redeploy from the new folders: `cd /opt/apps/wearit-api && ./deploy_prod.sh`, and the same for `wearit-web`. A redeploy is needed because the backend container's bind mount still points at the old path. Compose for the frontend uses the folder name only as the project name, which is fine because `container_name` is fixed.
4. What could break: anything that hardcodes `/opt/apps/wear-it*`, such as cron jobs, scripts, nginx `root`/`alias` lines and certbot hooks. Check with `grep -rn 'opt/apps/wear-it' /etc /root /home 2>/dev/null` and `crontab -l`. Also update the paths in `vps-setup.md` and in any of your own notes.

### Step 4 — Local folder names
1. Rename `1-main-projects/1-wear-it/wear-it` → `wearit-api` and `wear-it-react` → `wearit-web`. You can optionally rename `1-wear-it` → `1-wearit`.
2. First remove the temporary worktrees from this session (`git worktree prune`). Otherwise git keeps stale worktree links.
3. Update `2-tech/server-backup/backup.sh` (line 23: `"$PROJ/1-wear-it/wear-it"` is used to find the backend env file for the Mongo dump; it breaks right after the move). Also update `sample-images/migrate-supabase.js` usage comments, `vps-setup.md` paths, editor/Cursor workspaces, `.cursorignore` and any AGENTS.md/CLAUDE.md paths.
4. What could break: absolute paths saved in IDE workspaces and terminal history, plus Claude/Cursor project memory keyed by path. The backup script fails until it is updated.

### Optional extras (low value, more risk)
- `package.json` `name` → `wearit-api` / `wearit-web`. This is harmless, but it changes `package-lock.json` and needs a commit.
- Rename the favicon `wear-it.ico` → `wearit.ico` and update `index.html`.
- **Do not** rename the MongoDB database `WearIt`. That would need a dump and restore plus a `MONGO_URL` change, and backup scripts and history reference it. The name is invisible to users.
- Keep the domains as they are. They already use `wearit`.

### Order summary
0 backup → 1 GitHub rename + remotes → 2 container/image names (stop old ones by hand first) → 3 server folders + redeploy → 4 local folders + backup.sh. Each step can be done and verified alone. Steps 2 and 3 can be combined into one maintenance window.
