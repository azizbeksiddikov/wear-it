# Contributing

Thanks for taking a look. Small fixes and focused improvements are welcome.

## Setup

Follow the quick start in the [README](README.md). You need Node.js 24, MongoDB and a Supabase project. Copy `.env.example` to `.env` and fill it in (variables: [docs/KEYS.md](docs/KEYS.md)). Never commit the real file.

## Workflow

1. Open an issue first for anything bigger than a small fix, so we agree on the approach.
2. Branch from `develop`. `master` is what runs in production.
3. Keep one logical change per commit, with a short message that says what and why (for example `fix: reject empty product name`).
4. Open a pull request against `develop`.

## Before you open a pull request

```bash
npm run lint
npm run build
npm test
```

All three must pass. CI runs the same commands.

## Code style

- TypeScript, two-space indentation.
- Flow is router → controller → service → schema. Keep business logic in `src/models/*.service.ts`.
- User-facing errors: `throw new Errors(HttpCode.X, Message.Y)`. Add a new `Message` member for a new error. The key is the stable `errorCode` clients rely on, so never rename a key. Keep message text free of double quotes (the admin pages embed it in `alert("...")`).
- Add or update a test when you change behaviour.
- Update the docs in `docs/` if you change routes, configuration or deployment.

## Reporting bugs

Open an issue with what you did, what you expected, what happened and your Node.js version. Do not paste secrets, tokens or connection strings. Security problems: see [SECURITY.md](SECURITY.md).
