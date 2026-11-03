# Operations

## Health and logs

- `GET /health` returns `{ "status": "healthy" }`. Docker uses it for the container health check (`healthcheck.js`).
- Logs: `docker logs --tail 200 -f wear-it-backend-prod`. The container's log driver keeps limited history when started through compose (30 MB × 3); started with `docker run` it uses Docker's default.
- Every request is logged as `METHOD URL time [status]`.

## Scripts (`scripts/ops`)

| Script                | Purpose                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `migrate-supabase.js` | moves the Supabase buckets `products` and `members` to a new project. Saves local copies in `./products` and `./members`. Uploads only, unless run with `--apply`, which also rewrites image URLs in MongoDB. Needs `SUPABASE_PROJECT_URL` and `SUPABASE_SECRET_KEY` (KEYS.md) |

Script rules (dry-run by default, never print keys) are in AGENTS.md.

## Backups

- Database: MongoDB, database `WearIt`. Keep a recent dump outside the server.
- Images: Supabase Storage buckets `products` and `members`. Keep a copy outside Supabase.
- Do not back up logs.

## Troubleshooting

- App exits at start: `PORT` or `MONGO_URL` missing (KEYS.md).
- Site loads but images are missing: check `SUPABASE_PROJECT_URL` and `SUPABASE_SECRET_KEY`, and that the image URLs in MongoDB point at the current Supabase project.
- Everyone is logged out after a deploy: `SECRET_TOKEN` changed.
- Admin session cookie: with `COOKIE_SECURE=true` the cookie is HTTPS-only. `app.ts` does not set `trust proxy`, so behind nginx the app sees plain HTTP; test admin login after changing this flag.
- Port already in use on deploy: the old container (`wear-it-backend-prod`, or a compose-started `wear-it-backend`) is still running.
- Update or delete answers 304 and the client shows no message: known limit, see `docs/ARCHITECTURE.md` (Error codes).
