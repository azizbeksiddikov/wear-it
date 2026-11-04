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

| Area    | Routes                                                                                                                    | Auth                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Member  | `POST /member/signup`, `POST /member/login`                                                                               | none                                           |
|         | `POST /member/logout`, `GET /member/detail`, `POST /member/update` (multipart, field `memberImage`), `POST /member/topup` | required                                       |
| Product | `GET /product/all` (search, sort, paging), `GET /product/:id`                                                             | optional (counts a view for logged-in members) |
| Order   | `POST /order/create`, `GET /order/all`, `POST /order/update`, `POST /order/delete`                                        | required                                       |
| Review  | `POST /review/create`, `POST /review/update`, `POST /review/delete`                                                       | required                                       |
| Health  | `GET /health` → `{ "status": "healthy" }`                                                                                 | none                                           |

## Data model (MongoDB)

- **Member**: type (`USER`, `ADMIN`), status (`ACTIVE`, `BLOCKED`, `DELETED`), unique email and phone, hashed password (bcrypt, not selected by default), name, address, image, `memberPoints` (new members start with 100).
- **Product** and **ProductVariant**: name, category, gender, description, images, views, reviews count and rating; variants carry size, colour, price, optional sale price and stock quantity.
- **Order** and **OrderItem**: status (`PAUSED`, `PROCESSING`, `FINISHED`, `DELETED`, `CANCELLED`), shipping address, subtotal, shipping cost, total.
- **Review**: product, member, rating, comment. **View**: which member viewed which product or member.

Money is points. This is a demo store: points are free and no real money is involved.

- New members start with 100 points.
- `POST /member/topup` with `{ "amount": <whole number 1 to 1000> }` adds free points and returns the updated member (no password). A balance can never go above 10000 points. The limits are the constants `TOPUP_MIN_AMOUNT`, `TOPUP_MAX_AMOUNT` and `POINTS_BALANCE_CAP` in `src/libs/config.ts`. The update is one atomic `$inc`, so parallel requests cannot pass the cap. Errors: `TOPUP_INVALID_AMOUNT` (400, not a whole number in range) and `TOPUP_LIMIT_REACHED` (400, the balance would pass the cap).
- `POST /member/update` only changes the profile fields (email, phone, password, name, address, description, image). `memberPoints`, `memberType` and `memberStatus` in the body are ignored; only the admin dashboard can set them. A new password is hashed.

**Orders are priced on the server.** `POST /order/create` reads only the shipping address and, per item, the `variantId` and `itemQuantity` (1 to 20, whole numbers). Names, images, unit and sale prices, subtotal, shipping (5 points under a 50-point subtotal, otherwise free) and total are rebuilt from the database (`libs/utils/orderPricing.ts`); anything the client sends for them is ignored. Out-of-stock items answer `OUT_OF_STOCK`, malformed orders `INVALID_ORDER`.

`POST /order/update` reads only `_id` and `orderStatus`. The allowed moves are `PAUSED` to `PROCESSING` or `DELETED`, `PROCESSING` to `FINISHED` or `CANCELLED`, `FINISHED` to `CANCELLED` or `DELETED`, and `CANCELLED` to `DELETED`; everything else, including repeating a status, answers `INVALID_ORDER`. Moving to `PROCESSING` needs a delivery address and enough points. It then charges the total stored on the order and reduces stock; `CANCELLED` refunds that stored total and restores the stock. Points, stock and status change in one transaction with conditional updates, so two requests at once cannot spend the same points or stock twice (`Order.service.ts`).

## Auth

- Storefront: a JWT (`SECRET_TOKEN`, 48 hours) is set in the `accessToken` cookie on signup and login. The cookie is `httpOnly` (page scripts cannot read it), `sameSite=lax`, `path=/`, and `secure` when `NODE_ENV=production`; options live in `authCookieOptions()` (`src/libs/config.ts`). The token is **not** in the JSON body: signup and login answer `{ member }`, and the client must send requests with credentials (`withCredentials: true`). Logout clears the cookie. `verifyAuth` requires the cookie, `retrieveAuth` reads it when present.
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

Codes: `SOMETHING_WENT_WRONG`, `NO_DATA_FOUND`, `CREATE_FAILED`, `UPDATE_FAILED`, `DELETE_FAILED`, `NO_MEMBER_EMAIL`, `USED_EMAIL_PHONE`, `BLOCKED_USER`, `WRONG_PASSWORD`, `NOT_AUTHENTICATED`, `TOKEN_CREATION_FAILED`, `FILE_UPLOAD_FAILED`, `RATING_OUT_OF_RANGE`, `EXISTING_USER`, `NOT_ENOUGH_POINTS`, `NO_ADDRESS`, `TOPUP_INVALID_AMOUNT`, `TOPUP_LIMIT_REACHED`, `INVALID_ORDER`, `OUT_OF_STOCK`.

Any address no router answers (outside `/admin`) gets **404** with the same JSON body `{ code, message, errorCode: "NO_DATA_FOUND" }`, and so does a product id that does not exist or is not a valid id. Failed updates and deletes answer **404** when the record does not exist (or is not the member's own) and **400** when the request is rejected (for example an email another member already uses, or an order whose status forbids deleting). They never answer 304, because a 304 response has no body and the client would lose the `errorCode`. A test keeps `NOT_MODIFIED` out of the code.

## Tests

`npm test` runs everything in `test/` with the Node test runner.

- **API tests** (`test/api.test.ts`) call the real Express app with supertest against an in-memory MongoDB (`mongodb-memory-server`, a one-node replica set because orders use transactions; see `test/helpers/testApp.ts`). They cover signup and login (httpOnly cookie, no token in the body), duplicate and wrong-password errors, `NOT_AUTHENTICATED`, product list, search, paging and detail, the points top-up and its cap, the profile update ignoring `memberPoints`, orders (server-side pricing, address and points checks, stock and points moving on `PROCESSING` and `CANCELLED`, no double payment, no free refund, two simultaneous payments), reviews (needs a finished order, rating and count) and the 404/400 answers for failed updates and deletes. No network is used after the first run, which downloads a MongoDB binary (about 140 MB, cached in `node_modules/.cache/mongodb-memory-server`). Supabase is never called.
- **Unit tests**: error codes and messages, the profile whitelist, top-up validation, the cookie options, and a guard that keeps HTTP 304 out of the code.
