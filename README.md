# Secure Notes

A secure note-sharing POC built with **Next.js, TypeScript, Hono, PostgreSQL, Prisma, Zod, Argon2id, and Vitest**.

The project is intentionally designed as a small but security-conscious application rather than an over-engineered distributed system. The main goal is to demonstrate that private notes can be shared through controlled links with clear authentication, authorization, expiry, revocation, password protection, one-time access, view counting, rate limiting, and concurrency-safe behavior.

---

## Table of Contents

- [What the application does](#what-the-application-does)
- [Core features](#core-features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Request flow](#request-flow)
- [Project structure](#project-structure)
- [Authentication and sessions](#authentication-and-sessions)
- [Notes](#notes)
- [Secure sharing](#secure-sharing)
- [Share types](#share-types)
- [Access types](#access-types)
- [Share token security](#share-token-security)
- [Password/access-key security](#passwordaccess-key-security)
- [Expiry and revocation](#expiry-and-revocation)
- [One-time share concurrency](#one-time-share-concurrency)
- [View counting](#view-counting)
- [Rate limiting](#rate-limiting)
- [Database design](#database-design)
- [API reference](#api-reference)
- [Frontend routes](#frontend-routes)
- [Validation](#validation)
- [Error handling](#error-handling)
- [Testing](#testing)
- [Environment variables](#environment-variables)
- [Local setup](#local-setup)
- [Evaluator/demo accounts](#evaluatordemo-accounts)
- [Evaluator setup and test guide](#evaluator-setup-and-test-guide)
- [Demo checklist](#demo-checklist)
- [Security considerations](#security-considerations)
- [Scaling to 1 million users](#scaling-to-1-million-users)
- [Production improvements](#production-improvements)
- [Important design decisions](#important-design-decisions)
- [Trade-offs](#trade-offs)
- [How to explain this project in an interview](#how-to-explain-this-project-in-an-interview)
- [Future improvements](#future-improvements)

---

## What the application does

Secure Notes lets an authenticated user:

1. Create a private note.
2. Edit or delete that note.
3. Create a secure share link for the note.
4. Choose whether the link:
   - works only once, or
   - works repeatedly until a specified expiry time.
5. Choose whether the link is:
   - public, or
   - protected by a server-generated access key.
6. Share the generated URL with another person.
7. Revoke the link later.
8. See the share status and successful view count.

The important security rule is:

> A URL existing does not automatically mean the note can be viewed. Every access is checked against the current database state.

---

## Core features

### Authentication

- User registration
- Login/logout
- Server-side sessions
- HTTP-only session cookie
- Seven-day session lifetime
- Argon2id password hashing
- Server-side authentication checks

### Notes

- Create notes
- List the current user's notes
- Read a note
- Edit a note
- Delete a note
- Ownership checks on every protected note operation

### Sharing

Four combinations are supported:

| Share type | Access type | Behavior |
|---|---|---|
| One-time | Public | First successful view consumes the link |
| One-time | Password | Correct access key consumes the link |
| Time-based | Public | Multiple successful views until expiry |
| Time-based | Password | Multiple successful unlocks until expiry |

Additional behavior:

- Secure random share tokens
- Token hashes stored instead of raw URL tokens
- Server-generated access keys
- Argon2id access-key hashing
- Server-side expiry enforcement
- Owner-controlled revocation
- Atomic one-time consumption
- Accurate successful-view counting
- View event records
- Login and access-key rate limiting

---

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 | App Router UI and application shell |
| Language | TypeScript | Type safety |
| API | Hono | Lightweight HTTP API routing |
| Database | PostgreSQL | Source of truth |
| ORM | Prisma 7 | Database access and transactions |
| Validation | Zod | Server-side request validation |
| Password hashing | Argon2id | Password and access-key protection |
| Styling | Tailwind CSS | UI styling |
| UI | shadcn/ui / Base UI | Reusable interface components |
| Icons | Lucide React | Interface icons |
| Notifications | Sonner | User feedback |
| Testing | Vitest | Unit/integration tests |
| Database hosting | PostgreSQL/Neon compatible | Hosted PostgreSQL environment |

---

## Architecture

The application uses a simple layered architecture:

```
Browser
   |
   v
Next.js App Router
   |
   +----------------------+
   |                      |
   v                      v
React UI              Hono API
                          |
                          v
                       Prisma
                          |
                          v
                    PostgreSQL
```

The database is the source of truth for:

- users
- sessions
- notes
- share links
- expiry state
- revocation state
- one-time usage state
- view counts
- view events

### Why Hono?

Hono keeps the API layer small and explicit. The Next.js catch-all route forwards requests into Hono:

`src/app/api/[[...route]]/route.ts`

This gives the project a clean separation:

- Next.js handles the application/UI layer.
- Hono handles HTTP/API behavior.
- Prisma handles persistence.
- PostgreSQL handles durable state and concurrency.

---

## Request flow

### Normal authenticated request

```
Browser
  |
  | session cookie
  v
Hono route
  |
  | validate session
  v
getAuthenticatedUser()
  |
  v
Prisma
  |
  v
PostgreSQL
```

The client does not send a `userId` and ask the server to trust it.

Instead:

1. Browser sends the session cookie.
2. Server hashes the session token.
3. Server looks up the session.
4. Server obtains the authenticated user's ID.
5. Database queries are restricted to that user.

This is important for authorization.

---

# Authentication and sessions

## Password storage

Passwords are hashed using Argon2id.

The application never stores:

```
password = "my-password"
```

Instead it stores an Argon2id hash.

Argon2 automatically handles password-hashing parameters and salt information inside the encoded hash.

### Why Argon2id?

Password hashing should be deliberately expensive.

A fast general-purpose hash such as SHA-256 is not appropriate for password storage because attackers can try huge numbers of guesses quickly.

Argon2id is designed specifically for password hashing and is memory-hard.

---

## Session design

The session flow is:

```
login
  |
  v
generate random session token
  |
  +--> browser receives raw token in HTTP-only cookie
  |
  +--> database receives SHA-256(token)
```

The database stores:

- session ID
- user ID
- token hash
- expiry
- creation time

It does not store the raw session token.

### Cookie properties

The session cookie uses:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- `Path=/`
- seven-day max age

### Why HTTP-only?

JavaScript cannot read an HTTP-only cookie.

That reduces the impact of client-side script trying to steal the session token.

---

# Notes

Notes are private resources owned by users.

The important authorization pattern is:

```where: {
  id: noteId,
  userId: authenticatedUser.id
}
```

This is used instead of:

```where: {
  id: noteId
}
```

The second approach would authenticate the user but could accidentally allow access to another user's note.

This project treats **authentication and authorization as separate concerns**:

- Authentication: "Who are you?"
- Authorization: "Are you allowed to access this resource?"

---

# Secure sharing

A share link is represented by a `ShareLink` record.

The record contains:

- note ID
- token hash
- share type
- access type
- optional password/access-key hash
- expiry
- revocation time
- one-time usage time
- view count
- timestamps

The raw share URL token is not stored.

---

# Share types

## One-time

A one-time share can be successfully used exactly once.

After successful access:

```
usedAt = current timestamp
viewCount = viewCount + 1
```

Any later request is rejected.

### Important detail

A failed access-key attempt does **not** consume a one-time share.

Only successful authorization consumes it.

That means:

```
wrong key -> still available
correct key -> consumed
second correct key -> rejected
```

---

## Time-based

A time-based share has an `expiresAt` timestamp.

It can be viewed multiple times while:

```
expiresAt > current server time
```

After expiry, access is rejected.

The browser's clock is never trusted.

---

# Access types

## Public

A public share requires only possession of the secret URL.

The server still checks:

- token exists
- not revoked
- not expired
- not already used if one-time
- share is actually public

A password-protected share cannot be accessed through the public-view endpoint.

---

## Password-protected

A password-protected share requires:

1. valid share token
2. valid share state
3. correct access key

Only after the key is verified does the application:

- consume a one-time share, or
- record a successful time-based view.

This ordering is important.

A wrong access key must not increment `viewCount` or set `usedAt`.

---

# Share token security

Share tokens are generated with:

```
crypto.randomBytes(32)
```

That gives 256 bits of random data.

The token is encoded using base64url so it can safely be placed in a URL.

The flow is:

```
random bytes
   |
   v
raw share token
   |
   +----> returned to owner as part of URL
   |
   +----> SHA-256
              |
              v
        tokenHash in database
```

If the database is leaked, an attacker does not directly receive the raw URL token.

---

# Password/access-key security

Password-protected shares receive a server-generated access key.

The key is generated using cryptographically secure randomness.

The application then hashes it with Argon2id.

The database stores:

```
passwordHash
```

not:

```
accessKey
```

The owner receives the generated access key when the share is created.

The access key is not returned again from the share-management endpoint.

---

# Expiry and revocation

There are two different concepts.

## Expiry

Expiry is automatic.

For a time-based share:

```
expiresAt <= now
```

means the share is expired.

The API checks this on the server.

## Revocation

Revocation is manual.

The owner can revoke an active link.

The database keeps the record but sets:

```
revokedAt = current timestamp
```

This preserves historical information such as:

- when the share existed
- how many successful views occurred
- whether it was revoked

A revoked share cannot be used again.

---

# One-time share concurrency

This is one of the most important parts of the project.

A naive implementation could do:

```
1. SELECT share
2. Check usedAt == null
3. Return success
4. UPDATE usedAt
```

That has a race condition.

Imagine two requests arrive almost simultaneously:

```
Request A -> sees usedAt = null
Request B -> sees usedAt = null

Request A -> consumes
Request B -> consumes
```

The link was supposed to be usable once, but both requests could succeed.

## How this project prevents it

The actual claim is performed with a conditional database update:

```
UPDATE share_links
SET
  used_at = NOW(),
  view_count = view_count + 1
WHERE
  id = ?
  AND used_at IS NULL
  AND revoked_at IS NULL
  AND expiry is still valid
```

Prisma implements this using `updateMany` inside a transaction.

The application checks:

```
updated.count === 1
```

If it is:

- `1`: this request won the race.
- `0`: the share was already consumed or became invalid.

This moves the important concurrency decision into the database.

---

# View counting

A successful view means:

- valid token
- valid share state
- correct access type
- correct access key if required
- successful one-time claim or valid time-based update

Only then is `viewCount` incremented.

The increment uses:

```
viewCount: {
  increment: 1
}
```

instead of:

```
read viewCount
add 1 in JavaScript
write viewCount
```

The database-side increment avoids a lost-update problem when multiple requests happen close together.

Each successful access also creates a `ViewEvent`.

This gives two levels of information:

- `viewCount`: fast summary
- `ViewEvent`: event/audit history

---

# Rate limiting

The POC includes rate limiting for:

### Login

The login route tracks:

- IP
- normalized email

This limits repeated credential guessing.

### Password-protected share unlock

The unlock route tracks:

- client IP
- hashed share token

This makes repeated access-key guessing more difficult.

The current implementation uses an in-memory `Map`.

This is deliberately simple for the POC.

### Production scaling

With multiple application instances, the rate-limit state should move to shared infrastructure such as Redis.

Otherwise:

```
Server A -> has counter
Server B -> has different counter
```

and an attacker could potentially distribute attempts between instances.

---

# Database design

The main relationship graph is:

```
User
 |
 +----< Note
          |
          +----< ShareLink
                    |
                    +----< ViewEvent

User
 |
 +----< Session
```

## User

Stores the account identity and password hash.

## Session

Stores authenticated login sessions.

Important fields:

- `userId`
- `tokenHash`
- `expiresAt`

## Note

Stores the private note.

Important fields:

- `userId`
- `title`
- `content`

## ShareLink

Stores sharing rules and state.

Important fields:

- `tokenHash`
- `shareType`
- `accessType`
- `passwordHash`
- `expiresAt`
- `revokedAt`
- `usedAt`
- `viewCount`

## ViewEvent

Records each successful access.

---

# API reference

The API is mounted under `/api`.

## Health

### GET /api/health

Returns a simple API health response.

---

## Authentication

### POST /api/auth/register

Creates an account.

Request:

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### POST /api/auth/login

Authenticates the user and sets the session cookie.

### GET /api/auth/me

Returns the authenticated user.

### POST /api/auth/logout

Deletes the server-side session and clears the cookie.

---

## Notes

### POST /api/notes

Creates a note for the authenticated user.

### GET /api/notes

Lists notes owned by the authenticated user.

### GET /api/notes/:id

Returns one note if the authenticated user owns it.

### PATCH /api/notes/:id

Updates the title and/or content of an owned note.

### DELETE /api/notes/:id

Deletes an owned note.

---

## Share management

### POST /api/notes/:id/shares

Creates a share link.

Example request:

```json
{
  "shareType": "ONE_TIME",
  "accessType": "PASSWORD"
}
```

For a time-based share:

```json
{
  "shareType": "TIME_BASED",
  "accessType": "PUBLIC",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

The response contains the share URL.

Password-protected creation also returns the generated access key to the owner.

### GET /api/notes/:id/shares

Lists share metadata for an owned note.

The response does not expose raw secrets.

### POST /api/notes/:noteId/shares/:shareId/revoke

Revokes an owned share.

---

## Public sharing

### GET /api/share/:token

Returns share metadata.

This endpoint intentionally does not consume a one-time share.

This distinction is important because browsers and React development tooling can perform GET requests more than once.

### POST /api/share/:token/view

Consumes a public share access.

For:

- one-time: atomically consumes the link
- time-based: records a successful view

Password-protected shares are rejected here.

### POST /api/share/:token/unlock

Unlocks a password-protected share.

Request:

```json
{
  "accessKey": "GENERATED-KEY"
}
```

The key is verified before access is counted.

---

# Frontend routes

| Route | Purpose |
|---|---|
| `/` | Landing/application entry |
| `/login` | Login |
| `/register` | Registration |
| `/notes` | User's notes |
| `/notes/new` | Create note |
| `/notes/[id]` | View note |
| `/notes/[id]/edit` | Edit note |
| `/notes/[id]/share` | Manage/create shares |
| `/share/[token]` | Shared-note viewer |

The UI uses reusable components for:

- authentication
- note creation/editing
- note lists/cards
- sharing
- share status
- revoke confirmation
- password unlock
- shared-note display
- application shell/sidebar/header

---

# Validation

Zod is used at the API boundary.

The principle is:

> Never rely on the frontend as the security boundary.

Even if the UI prevents a bad request, someone can call the API directly.

## Authentication validation

- normalized email
- valid email format
- password length limits

## Note validation

- title required
- title maximum length
- content required
- content maximum length
- PATCH requires at least one field

## Share validation

- valid share type
- valid access type
- time-based shares require expiry
- one-time shares reject an expiry value

---

# Error handling

The API generally follows HTTP semantics:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication/access-key failure |
| 403 | Authenticated but not allowed for that operation |
| 404 | Resource not found |
| 409 | State conflict such as already-revoked share |
| 410 | Share existed but is no longer usable |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

The API avoids returning internal database details to clients.

Detailed errors are logged server-side while clients receive controlled messages.

---

# Testing

The project uses Vitest with a dedicated PostgreSQL test database.

The tests cover:

- database connectivity
- authentication/session security
- note ownership and CRUD behavior
- public shares
- password-protected shares
- one-time shares
- time-based shares
- expiry
- revocation
- view counts
- view events
- invalid access keys
- rate limiting
- HTTP-level Hono behavior
- one-time access race handling

The current local verification reached:

**42 tests passed with 0 failures.**

The test setup uses a separate `TEST_DATABASE_URL` so application data is not used for integration tests.

---

# Why the tests use the real Hono routes

The project avoids creating a fake test implementation.

For example:

```
Production
    |
    v
registerNoteRoutes(app, prisma)

Tests
    |
    v
registerNoteRoutes(testApp, testPrisma)
```

This is useful because the tests exercise the same route logic used by the application while injecting a different database.

That reduces the risk of having:

- one implementation for production
- another implementation that only exists to make tests pass

---

# Environment variables

Create a local environment file with values similar to:

```
DATABASE_URL="your-development-postgresql-connection-string"
TEST_DATABASE_URL="your-dedicated-test-postgresql-connection-string"
APP_URL="http://localhost:3000"
```

### DATABASE_URL

Used by the application Prisma client.

### TEST_DATABASE_URL

Used only by database/integration tests.

It should point to a dedicated test database.

### APP_URL

Used when generating share URLs.

For local development:

```
APP_URL="http://localhost:3000"
```

For deployment, it should point to the deployed application's public origin.

Do not commit environment files containing database credentials.

---

# Local setup

## 1. Install dependencies

Install the project's Node.js dependencies using the package manager you normally use.

## 2. Configure environment variables

Create the local environment configuration with:

- development PostgreSQL URL
- dedicated test PostgreSQL URL
- application URL

Never paste production credentials into source control.

## 3. Prepare Prisma

The repository contains Prisma migrations.

Apply the migrations to the configured development database and generate the Prisma client used by the application.

## 4. Start the application

Run the existing development script from `package.json`.

The application will be available at:

```
http://localhost:3000
```

## 5. Run tests

The project provides:

- `test`
- `test:watch`
- `test:coverage`

The integration tests should use the dedicated test database.

---

# Evaluator/demo accounts

These accounts are intended for **local POC demonstration only**.

They are not production credentials and should not be reused for a deployed production environment.

| Account | Email | Password | Suggested sample data |
|---|---|---|---|
| Demo User 1 | `demo.user1@secure-notes.test` | `DemoUser1@SecureNotes2026` | 3 notes |
| Demo User 2 | `demo.user2@secure-notes.test` | `DemoUser2@SecureNotes2026` | 3 notes |

### Important

The credentials above are documented demo credentials. They are **not database seed credentials** unless the corresponding users have been created in the configured database.

For a fresh database, create both accounts through the application's `/register` page before using them.

This keeps the README reproducible without requiring real passwords or database records to be committed to source control.

---

# Evaluator setup and test guide

This section is intended to let an evaluator go from a fresh clone to a complete functional/security demonstration.

## Step 1 — Configure PostgreSQL

Create:

- one development PostgreSQL database
- one separate test PostgreSQL database

Configure the connection strings in the local environment file:

```
DATABASE_URL="your-development-postgresql-connection-string"
TEST_DATABASE_URL="your-dedicated-test-postgresql-connection-string"
APP_URL="http://localhost:3000"
```

Do not commit the environment file.

## Step 2 — Install the project

Install the dependencies defined by `package.json`.

Then prepare Prisma using the repository's migration files and generated client.

The repository already contains the Prisma schema and migrations, so an evaluator does not need to manually recreate the database tables.

## Step 3 — Start the application

Start the Next.js development server using the `dev` script from `package.json`.

Open:

```
http://localhost:3000
```

The landing page provides links to registration and login.

## Step 4 — Create the two demo users

If the database is fresh, create:

### Demo User 1

```
Email: demo.user1@secure-notes.test
Password: DemoUser1@SecureNotes2026
```

### Demo User 2

```
Email: demo.user2@secure-notes.test
Password: DemoUser2@SecureNotes2026
```

Register both through the normal application UI.

This also demonstrates that account creation and password hashing work through the same production route used by real users.

## Step 5 — Add sample notes

Log in as Demo User 1 and create three notes.

Suggested notes:

### Note 1 — API Architecture

```
Title: API Architecture

Content:
Secure Notes uses Next.js for the application layer,
Hono for API routing, Prisma for database access,
and PostgreSQL as the source of truth.
```

### Note 2 — Security Design

```
Title: Security Design

Content:
Passwords and share access keys use Argon2id.
Share and session tokens are generated with secure randomness
and only their hashes are persisted.
```

### Note 3 — Concurrency

```
Title: One-Time Share Concurrency

Content:
One-time share consumption uses a conditional database update
so concurrent requests cannot both successfully consume the link.
```

Then log in as Demo User 2 and create three different notes.

Suggested notes:

### Note 1 — Private Note

```
Title: Private Note

Content:
This note belongs to Demo User 2 and should not be visible
from Demo User 1's authenticated account.
```

### Note 2 — Sharing Test

```
Title: Sharing Test

Content:
This note can be used to demonstrate public and password-protected
sharing behavior.
```

### Note 3 — Expiry Test

```
Title: Expiry Test

Content:
This note can be used to demonstrate a time-based share
and server-side expiry enforcement.
```

## Step 6 — Verify authorization

While logged in as Demo User 1:

1. Confirm User 1 sees only User 1's notes.
2. Confirm User 2's notes are not listed.
3. If testing through the API, use a User 2 note ID with User 1's session.
4. Confirm the server rejects access.

This demonstrates that authorization is based on the authenticated session rather than a client-supplied user ID.

## Step 7 — Test public one-time sharing

Using one of the demo notes:

1. Create a **One-time + Public** share.
2. Copy the generated share URL.
3. Open the URL in a private/incognito browser window.
4. Confirm the note is displayed.
5. Open the same URL again.
6. Confirm the share is no longer usable.
7. Return to the owner share-management page.
8. Confirm the successful view count is `1`.

## Step 8 — Test password-protected one-time sharing

1. Create a **One-time + Password** share.
2. Copy the generated share URL.
3. Record the generated access key.
4. Open the URL without being logged in.
5. Enter an incorrect access key.
6. Confirm access is rejected.
7. Confirm the share is still available.
8. Enter the correct access key.
9. Confirm the note opens.
10. Open the URL again.
11. Confirm the share is now used.
12. Confirm the view count is `1`.

This demonstrates that failed authentication does not consume a one-time share.

## Step 9 — Test public time-based sharing

1. Create a **Time-based + Public** share.
2. Set an expiry several minutes in the future.
3. Open the share.
4. Confirm the note is displayed.
5. Open the same URL again before expiry.
6. Confirm it works again.
7. Confirm the view count increases for each successful access.

## Step 10 — Test password-protected time-based sharing

1. Create a **Time-based + Password** share.
2. Set an expiry in the future.
3. Open the share URL.
4. Enter the wrong key.
5. Confirm access is rejected.
6. Confirm the view count does not increase.
7. Enter the correct key.
8. Confirm the note opens.
9. Open it again before expiry.
10. Confirm it can be accessed again.
11. Confirm successful views are counted.

## Step 11 — Test revocation

1. Create an active share.
2. Copy its URL.
3. Return to the owner share-management page.
4. Revoke the share.
5. Open the old URL.
6. Confirm access is rejected.
7. Confirm the share is displayed as revoked in the owner UI.

## Step 12 — Test expiry

For a time-based share:

1. Create a share with a short expiry.
2. Open it before expiry and confirm it works.
3. Wait until the expiry passes.
4. Open the same URL again.
5. Confirm access is rejected.

The server's current time is authoritative; the browser clock is not trusted.

## Step 13 — Test rate limiting

For a password-protected share:

1. Open the share.
2. Submit several incorrect access keys.
3. Continue until the configured rate limit is reached.
4. Confirm the API returns HTTP `429`.
5. Confirm the response includes `Retry-After`.

The POC uses an in-memory rate limiter. A production multi-instance deployment should use a shared store such as Redis.

## Step 14 — Run the automated tests

Run the project's test script against the dedicated test database.

The current verified test suite contains:

**42 tests passed with 0 failures.**

The suite covers:

- database connectivity
- session security
- note authorization
- note CRUD behavior
- public sharing
- password-protected sharing
- one-time shares
- time-based shares
- expiry
- revocation
- view counting
- view events
- invalid access keys
- rate limiting
- HTTP-level Hono routes
- concurrent one-time access

## Evaluator quick path

If there is limited time, the following sequence demonstrates most of the important functionality:

1. Register/login as Demo User 1.
2. Create a note.
3. Create a public one-time share.
4. Open it twice and show that only the first access succeeds.
5. Create a password-protected one-time share.
6. Show wrong-key rejection followed by successful unlock.
7. Show the view count.
8. Create a time-based public share.
9. Open it more than once.
10. Revoke another active share.
11. Run the automated tests.
12. Show the README sections explaining token hashing, Argon2id, atomic one-time consumption, and rate limiting.

---

# Demo checklist

A complete demo should show these flows.

## Authentication

1. Register a new account.
2. Login.
3. Confirm the authenticated notes area is accessible.
4. Logout.

## Note management

1. Create a note.
2. Open the note.
3. Edit the note.
4. Save the changes.
5. Delete a note.

## Public one-time share

1. Create a public one-time share.
2. Open the URL.
3. Confirm the note is displayed.
4. Open the same URL again.
5. Confirm it is no longer available.
6. Confirm the view count is 1.

## Password-protected one-time share

1. Create a password-protected one-time share.
2. Copy the generated access key.
3. Open the share.
4. Enter an incorrect key.
5. Confirm the link is still available.
6. Enter the correct key.
7. Confirm the note opens.
8. Try again.
9. Confirm the share is now used.
10. Confirm the view count is 1.

## Public time-based share

1. Create a time-based public share.
2. Open it successfully.
3. Open it again.
4. Confirm both views succeed.
5. Confirm the count increases.

## Password-protected time-based share

1. Create the share.
2. Open it.
3. Enter the wrong key.
4. Confirm no view is counted.
5. Enter the correct key.
6. Confirm the view count increases.
7. Open it again before expiry.
8. Confirm it works again.

## Revocation

1. Create an active share.
2. Revoke it from the owner UI.
3. Open the old URL.
4. Confirm access is rejected.

## Rate limiting

1. Submit several incorrect access keys.
2. Confirm the server eventually returns HTTP 429.
3. Check that `Retry-After` is present.

---

# Security considerations

## 1. Passwords

Stored using Argon2id.

## 2. Session tokens

Raw tokens are not stored in PostgreSQL.

Only SHA-256 hashes are stored.

## 3. Share tokens

Generated using cryptographically secure randomness.

Only token hashes are stored.

## 4. Access keys

Generated server-side and stored as Argon2id hashes.

## 5. Authorization

Owner checks use the authenticated session's user ID.

The client cannot choose another user's ID to gain access.

## 6. IDOR prevention

Note and share management operations include ownership checks in database queries.

## 7. Expiry

Expiry is enforced server-side.

The browser clock is not trusted.

## 8. One-time concurrency

One-time consumption is an atomic database operation.

## 9. View counting

The counter is incremented by the database rather than by application-side read-modify-write logic.

## 10. Brute-force protection

Login and password-share unlock attempts are rate limited.

## 11. Secret exposure

Raw share tokens and access keys are not returned from management/list endpoints after creation.

## 12. Public access boundary

Password-protected shares cannot be consumed through the public endpoint.

---

# Scaling to 1 million users

The current architecture is intentionally appropriate for a POC and small production deployment.

For significantly larger traffic, the main components can scale independently.

## Application layer

Run multiple Next.js instances behind a load balancer.

The application itself should remain stateless except for temporary in-memory concerns.

## Database

Use managed PostgreSQL with:

- connection pooling
- appropriate indexes
- monitoring
- backups
- read replicas where useful

The existing indexes support common access patterns:

- user -> notes
- note -> shares
- share expiry

## Sessions

For a larger deployment, server-side sessions can remain database-backed, but connection pooling and session cleanup become important.

Another option is a dedicated session store depending on operational requirements.

## Rate limiting

Replace the current in-memory map with a shared distributed store such as Redis.

## Background work

If analytics or cleanup grows, background workers can process:

- old view events
- expired sessions
- analytics aggregation
- notification jobs

This is not necessary for the current POC.

---

# Production improvements

The POC intentionally keeps infrastructure small.

Before a high-traffic production deployment, I would consider:

- distributed rate limiting
- structured logging
- centralized error monitoring
- audit logging
- stronger request size limits
- CSRF/origin validation for state-changing endpoints
- secret management
- database connection pooling
- automated migrations in deployment
- backups and restore testing
- security headers
- CSP
- automated dependency updates
- CI for lint/build/test
- end-to-end browser tests
- monitoring and alerting
- abuse detection
- session management UI
- optional share deletion/history policies

---

# Important design decisions

## Why PostgreSQL?

The application needs durable relational state and transaction guarantees.

The one-time share requirement especially benefits from transactional/conditional updates.

## Why Prisma?

Prisma provides:

- typed database access
- schema-driven models
- transactions
- migrations
- clear relation definitions

## Why Hono?

Hono keeps the API layer lightweight and easy to test directly.

## Why not microservices?

There is no need for them at this scale.

A single Next.js application plus Hono plus PostgreSQL is easier to build, deploy, debug, and explain.

## Why not store raw share tokens?

Because the raw token acts like a credential.

If someone gets database access, storing raw tokens would immediately expose usable links.

## Why not consume a share on GET?

Because GET requests can be triggered by:

- browser behavior
- prefetching
- duplicate rendering behavior
- crawlers

Consumption is therefore an explicit POST operation.

## Why count only successful views?

The requirement is to count successful access, not attempts.

Therefore:

```
wrong key       -> +0
expired         -> +0
revoked         -> +0
already used    -> +0
successful view -> +1
```

---

# Trade-offs

## In-memory rate limiter

### Advantage

Very simple and has no extra infrastructure.

### Limitation

It does not share state between multiple application instances.

For the POC this is acceptable; production should use a shared store.

## ViewEvent plus viewCount

### Advantage

`viewCount` gives fast access to the current count while `ViewEvent` keeps event history.

### Limitation

There is more data to write for each successful view.

For a small secure-sharing application this is a reasonable trade-off.

## Database-backed sessions

### Advantage

Easy revocation and server-side control.

### Limitation

Every authenticated request depends on a database lookup.

Connection pooling and caching strategies can help at larger scale.

---

# How to explain this project in an interview

A concise explanation:

> "I built a secure note-sharing application using Next.js, Hono, PostgreSQL and Prisma. Users authenticate through server-side sessions stored as hashed session tokens. Notes are owner-scoped, and users can create public or password-protected share links that are either one-time or time-based.
>
> The main security challenge was making one-time links safe under concurrent requests. Instead of checking usedAt and then updating it separately, I use a conditional database update inside a transaction. The update only succeeds when usedAt is null, the share isn't revoked, and the expiry is still valid. The affected-row count tells me whether that request won the race.
>
> I also hash passwords and access keys with Argon2id, hash share tokens before storing them, enforce expiry on the server, support owner revocation, increment view counts atomically, and rate-limit repeated login or access-key failures.
>
> I tested the important security and sharing flows against a dedicated PostgreSQL test database and reached 42 passing tests."

---

# Key interview questions

## "Why hash the share token?"

Because the token is effectively a credential. If the database is compromised, storing the raw token would make existing share URLs immediately usable.

## "Why SHA-256 for tokens but Argon2id for passwords?"

Share tokens are already generated with high entropy using a cryptographically secure random generator. SHA-256 is sufficient for storing/looking up that random secret.

Passwords and access keys may have lower entropy and are vulnerable to guessing, so they need a deliberately expensive password hash such as Argon2id.

## "How do you prevent two people from using a one-time link?"

The database performs a conditional atomic update:

```
usedAt IS NULL
AND not revoked
AND not expired
```

Only one request can change that row successfully.

## "Why isn't the access key stored?"

Because an access key is itself a credential. Storing its plaintext would expose it to anyone who gets database access.

## "How do you prevent users from accessing another user's note?"

The server derives the user ID from the authenticated session and includes it in the database query.

## "What happens if the wrong access key is entered?"

The key verification fails, a rate-limit failure is recorded, and the share remains unused. No view count is incremented.

## "Why is GET /share/:token separate from POST /share/:token/view?"

GET only retrieves metadata needed to render the sharing page.

POST represents the actual successful access and is where usage/view state changes.

## "How would you scale the rate limiter?"

Move the in-memory map to a shared Redis-backed rate limiter so all application instances use the same counters.

## "How would you scale the database?"

Use connection pooling, indexes, managed PostgreSQL, monitoring, backups, and read replicas where the workload justifies them.

---

# Future improvements

Possible next steps include:

- Redis-backed distributed rate limiting
- CSRF/origin protection middleware
- Content security policy
- stronger API request-size controls
- share analytics dashboard
- richer audit history
- session/device management
- automated cleanup jobs
- email-based account recovery
- end-to-end Playwright tests
- GitHub Actions CI
- deployment documentation
- observability with structured logs and metrics

These are intentionally outside the core POC so the current system stays understandable and easy to demonstrate.

---

## Project philosophy

The project follows a simple rule:

> Keep the architecture small, but make the security-critical decisions explicit.

The most important parts are not the number of services or frameworks. They are the boundaries:

- authentication before protected operations
- authorization based on server-side identity
- secrets generated with secure randomness
- secrets stored as hashes
- expiry checked by the server
- one-time state changed atomically
- successful access counted only after authorization
- rate limits around guessing-sensitive operations
- tests around the security rules

That makes the codebase small enough to understand while still demonstrating the engineering decisions expected from a production-minded developer.
