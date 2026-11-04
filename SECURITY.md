# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting (the **Security** tab of this repository, then **Report a vulnerability**).

Include what you found, how to reproduce it and what you think the impact is. You will get an answer as soon as the maintainer can, usually within a week.

## Known limitations

These are documented in [PROGRESS.md](PROGRESS.md) and are not secrets:

- CORS allows every origin with credentials by default.

## Keeping your own deployment safe

- Keep real values only in git-ignored env files or in your host's secret store. Never commit them.
- Use long random values for `SECRET_TOKEN` and `SESSION_SECRET`.
- Use the Supabase **secret** key on the server only, never in a browser.
- Serve the API over HTTPS and set `COOKIE_SECURE=true` once your proxy is set up.
