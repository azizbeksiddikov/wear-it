# Architecture

One Express 5 app (`src/server.ts` → `src/app.ts`) that serves a REST API for the storefront and EJS admin pages.

## Request flow

`app.ts` sets up, in order: static files, body parsers, cookies, CORS (`origin: true`, credentials), request logging (morgan), sessions (`express-session` stored in MongoDB collection `sessions`, 1 day), `/health`, a small HTML landing page at `/`, then two routers:

- `/admin` → `router-admin.ts` (EJS pages in `src/views`, session login).
- `/` → `router.ts` (REST API below).

Layers: **router → controller (`src/controllers`) → service (`src/models/*.service.ts`) → Mongoose schema (`src/schema`)**. Types and enums are in `src/libs`.

Ports (container port = host port, set per environment through `PORT` in the deploy scripts and compose files):

|     | Prod | Dev  | Local |
| --- | ---- | ---- | ----- |
| api | 4011 | 4111 | 4211  |

The storefront uses 4010, 4110 and 4210 (see the `wear-it-react` repository).

## REST API (`src/router.ts`)

| Area    | Routes                                                                                              | Auth                                           |
| ------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Member  | `POST /member/signup`, `POST /member/login`                                                         | none                                           |
|         | `POST /member/logout`, `GET /member/detail`, `POST /member/update` (multipart, field `memberImage`) | required                                       |
| Product | `GET /product/all` (search, sort, paging), `GET /product/:id`                                       | optional (counts a view for logged-in members) |
| Order   | `POST /order/create`, `GET /order/all`, `POST /order/update`, `POST /order/delete`                  | required                                       |
| Review  | `POST /review/create`, `POST /review/update`, `POST /review/delete`                                 | required                                       |
| Health  | `GET /health` → `{ "status": "healthy" }`                                                           | none                                           |

## Data model (MongoDB)

- **Member**: type (`USER`, `ADMIN`), status (`ACTIVE`, `BLOCKED`, `DELETED`), unique email and phone, hashed password (bcrypt, not selected by default), name, address, image, `memberPoints` (new members start with 100).
- **Product** and **ProductVariant**: name, category, gender, description, images, views, reviews count and rating; variants carry size, colour, price, optional sale price and stock quantity.
- **Order** and **OrderItem**: status (`PAUSED`, `PROCESSING`, `FINISHED`, `DELETED`, `CANCELLED`), shipping address, subtotal, shipping cost, total.
- **Review**: product, member, rating, comment. **View**: which member viewed which product or member.

Money is points. Moving an order to `PROCESSING` needs a delivery address and enough points; it then reduces stock and the member's points (`Order.service.ts`).

## Auth

- Storefront: a JWT (`SECRET_TOKEN`, 48 hours) is set in the `accessToken` cookie on signup and login (`sameSite=lax`, `secure` in production, readable by JavaScript). `verifyAuth` requires it, `retrieveAuth` reads it when present.
- Admin: session login (`express-session`).

## Images

Uploads use multer in memory (10 MB limit) and go to Supabase Storage buckets `products` and `members` (`libs/utils/uploader.ts`, `libs/utils/supabase.ts`). The database stores the public URLs.

## Error codes

Errors are thrown as `new Errors(HttpCode.X, Message.Y)` (`src/libs/Errors.ts`). Controllers answer with the HTTP status and this JSON body:

```json
{
  "code": 401,
  "message": "Wrong password. Please try again.",
  "errorCode": "WRONG_PASSWORD"
}
```

- `code` is the HTTP status, `message` is friendly English text, `errorCode` is the stable key of the `Message` enum.
- Clients should translate or branch on `errorCode`. Rewording a message is safe, renaming a key is a breaking change.
- Anything that is not an `Errors` instance is answered with `{ code: 500, message: "Something went wrong. Please try again.", errorCode: "SOMETHING_WENT_WRONG" }`.

Codes: `SOMETHING_WENT_WRONG`, `NO_DATA_FOUND`, `CREATE_FAILED`, `UPDATE_FAILED`, `DELETE_FAILED`, `NO_MEMBER_EMAIL`, `USED_EMAIL_PHONE`, `BLOCKED_USER`, `WRONG_PASSWORD`, `NOT_AUTHENTICATED`, `TOKEN_CREATION_FAILED`, `FILE_UPLOAD_FAILED`, `RATING_OUT_OF_RANGE`, `EXISTING_USER`, `NOT_ENOUGH_POINTS`, `NO_ADDRESS`.

Known limit: `UPDATE_FAILED` and `DELETE_FAILED` are thrown with HTTP 304 in some services (order, member, product updates and deletes). A 304 response has no body, so clients see the status but not the `errorCode`. Changing those to 400 or 404 would fix it but changes the status clients see, so it is left for a decision (see PROGRESS.md).

## Tests

`test/errors.test.ts` covers the code mapping and the response body shape. Run `npm test`.
