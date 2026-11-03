# Keys and environment variables

Names and meaning only. **Never put real values in this file, the repo, or chat.** Values live in git-ignored env files (one for production, one for local development). Start from `.env.example`.

Derived from source code (`src/`), not from env files.

| Variable               | Used by                              | Required | Meaning                                                                                                        |
| ---------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `PORT`                 | server, health check, deploy scripts | yes      | port the app listens on (app exits if missing). Must be `3003` in Docker, because the container publishes 3003 |
| `MONGO_URL`            | server, session store                | yes      | MongoDB connection string (database `WearIt`). The app exits if missing                                        |
| `SECRET_TOKEN`         | `Auth.service.ts`                    | yes      | JWT signing secret. Rotating it logs every storefront user out                                                 |
| `SESSION_SECRET`       | `app.ts`                             | yes      | secret for admin session cookies                                                                               |
| `COOKIE_SECURE`        | `app.ts`                             | no       | `true` makes the admin session cookie HTTPS-only                                                               |
| `NODE_ENV`             | controllers, Docker                  | no       | `production` makes the `accessToken` cookie `secure`. Set by `deploy_prod.sh`                                  |
| `SUPABASE_PROJECT_URL` | `libs/utils/supabase.ts`             | yes      | Supabase project URL for image storage                                                                         |
| `SUPABASE_SECRET_KEY`  | `libs/utils/supabase.ts`             | yes      | Supabase secret key (server only)                                                                              |

## Where each lives

| Environment        | Where                                                      | Notes                            |
| ------------------ | ---------------------------------------------------------- | -------------------------------- |
| Local dev          | local dev env file                                         | local or dev MongoDB             |
| Production         | an env file next to the app, or variables set by your host | never overwrite it when updating |
| One-off local runs | command-line variables                                     | win over any env file            |

## Rules

- Rotate a key by editing the server env file, then rerunning `deploy_prod.sh` (the container reads it at start).
- `scripts/ops/migrate-supabase.js` needs the new `SUPABASE_PROJECT_URL` and `SUPABASE_SECRET_KEY`, and never prints them.
- Agent rules are in AGENTS.md.
