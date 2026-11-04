# AGENTS.md: wear-it (Wearit backend)

Rules for any AI agent in this repo.

## Hard rules

- **Never read, print, edit, search inside or rename environment files**: `.env`, `.env.*`, `*.env`, `env`, `env.*` at any depth. Example and template files are included, except `.env.example` itself: the owner authorized agents to read and edit that one file (2026-11-01), and it holds placeholders only. Do not print process environments or resolved container configs that could show values. Use `docs/KEYS.md` for variable names. The apps and Docker read these files normally when they run.
- Never connect to or write to the production database, Supabase project or server without explicit approval.
- Develop and test on `develop`; merge to `master` when confirmed. Production runs only `master`.
- Do not commit, push, deploy or send anything unless asked.
- No big rewrites. Extend what exists.
- The admin dashboard (`router-admin.ts`, `controllers/admin.controller.ts`, `views/`) is low priority: do not change it unless asked.

## Stack

Node 24, Express 5, TypeScript, Mongoose 9 (MongoDB), EJS views for the admin, Supabase Storage for images, JWT cookie plus `express-session` for auth. Formatting is Prettier (`.prettierrc`: tabs, 120 columns, single quotes, trailing commas), same as the other projects.

## Layout

- `src/server.ts` (entry, DB connect), `src/app.ts` (middleware, sessions, health, routers).
- `src/router.ts` (REST API), `src/router-admin.ts` (admin pages).
- `src/controllers/` request handlers, `src/models/` services (business logic), `src/schema/` Mongoose schemas.
- `src/libs/`: `Errors.ts`, `config.ts`, `enums/`, `types/`, `utils/` (`uploader.ts`, `supabase.ts`).
- `test/`: node-runner tests. `api.test.ts` calls the real app against an in-memory MongoDB (`test/helpers/testApp.ts`); the first run downloads a MongoDB binary.
- Details: `docs/ARCHITECTURE.md`.

## Conventions

- Errors shown to users: `throw new Errors(HttpCode.X, Message.Y)` (`libs/Errors.ts`). The key of the `Message` enum is the stable `errorCode` sent to clients, the value is the English text. Add a new member for a new error. Reword a value freely; never rename a key without changing the client. Keep values free of double quotes (the admin puts them inside `alert("...")`).
- API error body: `{ code: <HTTP status>, message, errorCode }`.
- Controllers catch errors and reply `res.status(err.code).json(err)`; anything that is not an `Errors` becomes `Errors.standard` (500).
- Markdown file names are UPPERCASE (`KEYS.md`, `ARCHITECTURE.md`); the extension stays lowercase.
- Scripts that touch the database must be dry-run by default and never print connection strings or keys.

## Before finishing

1. Run `npm run format:files -- <changed files>`. It does what the editor does on save: organizes imports (sort, remove unused), then Prettier (`.prettierrc`: tabs, 120 columns, single quotes, trailing commas). Without it the editor rewrites your files the next time the maintainer saves them.
2. `npm run build`, `npm run lint` and `npm test` pass.
3. Update `PROGRESS.md` (and the relevant file in `docs/` if behavior changed).
4. Report briefly: what changed, what was verified, what needs the maintainer.

## Docs map

`README.md` · `docs/ARCHITECTURE.md` · `docs/KEYS.md` · `docs/DEPLOY.md` · `docs/OPERATIONS.md` · `PROGRESS.md`
