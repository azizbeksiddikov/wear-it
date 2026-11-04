# Operations

## Health and logs

- `GET /health` returns `{ "status": "healthy" }`. Docker uses it for the container health check (`healthcheck.js`).
- Logs: `docker logs --tail 200 -f wear-it-backend-prod`. The container's log driver keeps limited history when started through compose (30 MB × 3); started with `docker run` it uses Docker's default.
- Every request is logged as `METHOD URL time [status]`.
