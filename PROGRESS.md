# Progress: Wearit API

Last updated: 2026-11-03

Status of the backend. The storefront has its own file in [wear-it-react](https://github.com/azizbeksiddikov/wear-it-react).

## Done

- Products with variants and images, members, orders paid in points, reviews, view counts.
- Admin dashboard (EJS) for products, orders and members.
- Stable `errorCode` in every API error body and friendly English messages.
- Docs: README, `docs/` set (architecture, deploy, keys, operations), contributing and security notes, CI.
- Demo points top-up (`POST /member/topup`), profile updates can no longer set points, the login cookie is httpOnly, failed updates and deletes answer 404 or 400 instead of 304.
- Orders are priced and charged on the server: the client cannot set prices or totals, repeat a payment or refund, or take a status jump (`INVALID_ORDER`, `OUT_OF_STOCK`). Money, stock and status change in one transaction.
- Missing things answer 404 in the normal JSON error body: unknown routes, unknown or malformed product ids (these used to crash with 500), and search text is matched literally (`?search=(` used to crash with 500).
- Unit tests and API tests against an in-memory MongoDB (`npm test`), run in CI.

## Known gaps

- Tests cover only the error mapping. There are no API or integration tests.
- `UPDATE_FAILED` and `DELETE_FAILED` are thrown with HTTP 304 in some services. A 304 response has no body, so clients see the status but not the `errorCode`. Changing them to 400 or 404 would fix it but changes the status clients see.
- The `accessToken` cookie is readable by JavaScript (`httpOnly: false`); the storefront relies on that today.
- CORS allows every origin with credentials.
- The admin dashboard is low priority and has not had the same cleanup.
- `docker-compose.yml` exists, but the deploy scripts use `docker run`.
