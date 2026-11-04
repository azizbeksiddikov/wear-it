# Deploy

The API ships as a Docker image. You need a MongoDB database, a Supabase project (two public buckets, `products` and `members`) and a reverse proxy with HTTPS in front of it.

## Docker image

`Dockerfile` is a multi-stage Node 24 Alpine build. The build stage runs `npm ci` and `npm run build`. The final stage installs production dependencies only and copies `dist/`, `src/views`, `src/public` and `healthcheck.js`. It exposes port **4011** and has a health check (`GET /health`, every 30 seconds).

```bash
docker build -t wearit-api .
docker run -d --name wearit-api \
  --restart unless-stopped \
  -e PORT=4011 \
  -p 127.0.0.1:4011:4011 \
  --env-file .env \
  wearit-api
```

The container port equals the host port, set with `PORT`: prod **4011**, dev **4111**, local **4211**. The deploy scripts and compose files set it for you, so a `PORT` in your env file never changes the container port. Variable names and meanings: [KEYS.md](KEYS.md). Start from `.env.example` and never commit the real file.

The port is published on `127.0.0.1` only, so the API is reachable through your reverse proxy and not directly from the internet.

## Helper scripts

| Script                                         | Purpose                                                                                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy_prod.sh`                               | stops and removes the old container and image, rebuilds, starts `wear-it-backend-prod`, follows the logs. Needs the env file next to it. Also runs `rm -rf node_modules dist` first |
| `deploy_dev.sh`                                | same for a dev container, `wear-it-backend-dev`                                                                                                                                     |
| `docker-compose.yml`, `docker-compose.dev.yml` | an alternative way to run the same image. Do not start both ways on the same host, the port will clash                                                                              |

Both scripts use `docker run`. Adjust the container and image names if you run several instances.

## Reverse proxy

Put nginx, Caddy or similar in front and proxy your domain to `localhost:4011`. Terminate HTTPS there. The app does not set `trust proxy`, so behind a proxy it sees plain HTTP: if you set `COOKIE_SECURE=true`, test the admin login afterwards (see [OPERATIONS.md](OPERATIONS.md#troubleshooting)).

CORS allows any origin with credentials (`origin: true`). Restrict it in `src/app.ts` if you host the API on its own domain.

## Update an existing deployment

```bash
git fetch origin
git status --short          # make sure there are no local edits you need
git reset --hard origin/master
./deploy_prod.sh
```

Check `GET /health` returns `{"status":"healthy"}` and the storefront loads products. Never overwrite or print your env file during an update. Changing `SECRET_TOKEN` logs every storefront user out.
