# Wearit API

[![CI](https://github.com/azizbeksiddikov/wear-it/actions/workflows/ci.yml/badge.svg)](https://github.com/azizbeksiddikov/wear-it/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-24-339933)
![Express](https://img.shields.io/badge/Express-5-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

Backend for **Wearit**, a small fashion store. It is a single Express + TypeScript app on MongoDB that serves two things:

- a **REST API** for the storefront ([wear-it-react](https://github.com/azizbeksiddikov/wear-it-react)),
- a server-rendered **admin dashboard** (EJS pages under `/admin`) for products, orders and members.

Live demo: storefront <https://wearit.azbek.me> · API <https://wearit.admin.azbek.me>

## What it does

- **Products** with variants (size, colour, price, optional sale price, stock), several images, search, sorting and paging.
- **Members**: sign-up and login, hashed passwords (bcrypt), JWT cookie for the storefront, roles (`USER`, `ADMIN`) and blocking.
- **Orders** paid in loyalty points: delivery address and balance checks, stock is reduced when an order moves to `PROCESSING`.
- **Reviews and views**: ratings and comments, view counts per product.
- **Image uploads** to Supabase Storage.
- **Stable error codes**: every error carries an `errorCode` that clients can translate (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#error-codes)).

## Tech stack

Node.js 24 · Express 5 · TypeScript · Mongoose 9 (MongoDB) · EJS (admin) · Supabase Storage · JWT + `express-session` · Docker.

## Quick start

You need Node.js 24, a MongoDB database (local or Atlas) and a Supabase project with two public storage buckets, `products` and `members`.

```bash
git clone https://github.com/azizbeksiddikov/wear-it.git
cd wear-it
npm install

cp .env.example .env     # then fill in the values, see docs/KEYS.md
npm run dev              # http://localhost:4211
```

Check it is up:

```bash
curl http://localhost:4211/health
# {"status":"healthy"}
```

### Run with Docker

```bash
docker build -t wearit-api .
docker run -d --name wearit-api -e PORT=4011 -p 127.0.0.1:4011:4011 --env-file .env wearit-api
```

The container port always equals the host port (prod 4011, dev 4111, local 4211), set with `PORT`. More in [docs/DEPLOY.md](docs/DEPLOY.md).

## Try the API

```bash
curl -X POST http://localhost:4211/member/signup \
  -H "Content-Type: application/json" \
  -d '{"memberEmail":"me@example.com","memberPhone":"+10000000000","memberPassword":"secret123","memberFullName":"Me"}'

# direction: 1 = ascending, -1 = descending
curl "http://localhost:4211/product/all?page=1&limit=8&direction=-1"
```

The full route list is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#rest-api-srcrouterts). Errors always look like this:

```json
{ "code": 401, "message": "Wrong password. Please try again.", "errorCode": "WRONG_PASSWORD" }
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | run with nodemon and ts-node |
| `npm run build` | compile to `dist/` |
| `npm run start:prod` | run the compiled app |
| `npm test` | Node test runner over `test/*.test.ts` |
| `npm run lint` | ESLint |

## Project layout

```
src/
  server.ts, app.ts     entry point, middleware, sessions, routers
  router.ts             REST API routes
  router-admin.ts       admin dashboard routes
  controllers/          request handlers
  models/               services (business logic)
  schema/               Mongoose schemas
  libs/                 errors, config, enums, types, uploader
  views/, public/       admin pages and static files
test/                   tests
docs/                   architecture, deploy, keys, operations
```

## Documentation

|                                              |                                               |
| -------------------------------------------- | --------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | layers, routes, data model, auth, error codes |
| [docs/KEYS.md](docs/KEYS.md)                 | environment variables (names and meaning)     |
| [docs/DEPLOY.md](docs/DEPLOY.md)             | Docker image, ports, running in production    |
| [docs/OPERATIONS.md](docs/OPERATIONS.md)     | health check, logs, troubleshooting           |
| [SECURITY.md](SECURITY.md)                   | reporting a vulnerability                     |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | how to contribute                             |
| [PROGRESS.md](PROGRESS.md)                   | status, known gaps, roadmap                   |

## Related

- Storefront: [wear-it-react](https://github.com/azizbeksiddikov/wear-it-react)

## License

[MIT](LICENSE) © 2026 Azizbek Siddikov
