# IMF Gadget API

A Mission: Impossible-themed REST API for managing an IMF gadget inventory. It has JWT-authenticated agents, auto-generated codenames, mission success probabilities, soft decommissioning and a self-destruct endpoint. Built with Express, PostgreSQL and Sequelize, and documented with Swagger.

![Node.js](https://img.shields.io/badge/Node.js-Express%204-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Sequelize%206-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/auth-JWT-000000?logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/docs-Swagger-85EA2D?logo=swagger&logoColor=black)
![Render](https://img.shields.io/badge/deployed%20on-Render-46E3B7?logo=render&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)

[![CI](https://github.com/VamsiKrishnaThota03/imf-gadget-api/actions/workflows/ci.yml/badge.svg)](https://github.com/VamsiKrishnaThota03/imf-gadget-api/actions/workflows/ci.yml)
[![CodeQL](https://github.com/VamsiKrishnaThota03/imf-gadget-api/actions/workflows/codeql.yml/badge.svg)](https://github.com/VamsiKrishnaThota03/imf-gadget-api/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Live demo

- Swagger UI: **https://imf-gadget-api-dhbc.onrender.com/api-docs**
- Base URL: `https://imf-gadget-api-dhbc.onrender.com`

> The free Render instance sleeps when idle, so the first request after a quiet
> period takes 30-60s. If the demo does not answer at all, the free Postgres
> instance behind it has expired — see [Deployment](#deployment-render).

## Startup and failure behaviour

This is the part worth reading. A free managed Postgres sleeps when idle and
takes 30-60s to wake, and the original startup sequence was:

```js
sequelize.authenticate()
  .then(() => sequelize.sync())
  .then(() => app.listen(PORT, HOST))
  .catch(() => process.exit(1));   // <- a sleeping database kills the process
```

A single failed connection exited the process before the port was ever opened.
The platform restarted it, hit the same sleeping database, and after enough
cycles marked the whole service failed — which is exactly how this deployment
died.

It now starts in the other order:

1. **Listen first.** The port opens immediately, so the platform's health check
   against `/health` passes on the first try and never races a cold database.
2. **Connect in the background, with backoff.** `connectWithRetry()` retries
   forever with exponential backoff capped at 30s and *full jitter* (a random
   delay inside the window), so several instances restarting together do not
   retry in lockstep against a database that is still waking.
3. **Degrade, do not die.** Until the connection lands, `/api/*` answers
   `503` with `Retry-After: 30` instead of leaking a Sequelize connection error
   as an opaque 500. `/`, `/health` and `/api-docs` stay up throughout, so the
   demo never looks dead.
4. **Separate the probes.** `/health` is liveness and deliberately never touches
   the database — restarting a healthy process would throw away the retry
   progress. `/health/ready` is readiness and reports `attempts` and
   `lastError` so a failing deploy explains itself.

A missing `JWT_SECRET` or `DATABASE_URL` still exits immediately: that is a
deploy mistake, and no amount of retrying fixes it.

`test/readiness.test.js` locks all of this in, and CI runs the server against a
port with nothing listening on it to prove it stays up and serves 503s.

## Overview

Agents register and log in with a username and password and get a JWT (valid for one day by default). Every gadget endpoint requires that token. When a gadget is created it gets a random codename (for example "The Phoenix" or "Operation Kraken") and a random mission success probability between 60 and 100. Deleting a gadget is a soft delete: it is marked `Decommissioned` with a timestamp. The self-destruct endpoint marks it `Destroyed` and returns a random confirmation code. Sequelize creates the tables automatically on startup (`sequelize.sync()`).

## Features

- **JWT authentication:** register and log in with bcrypt-hashed passwords; send `Authorization: Bearer <token>` on gadget routes. Tokens expire (`JWT_EXPIRES_IN`, default `1d`), password hashes are never returned, and the auth routes are rate limited
- **Input validation:** only `name` is accepted on create and only `name`/`status` on update; anything else is rejected with `400`
- **Gadget CRUD**, with gadget IDs as UUIDs
- **Automatic codenames:** a random prefix (The / Project / Operation / Codename / Agent / Mission) plus one of 30 nouns, enforced unique at the database level. On a collision the API retries and then falls back to a numbered codename such as "Operation Kraken 417"
- **Mission success probability:** a random whole number from 60 to 100, assigned on creation
- **Status lifecycle:** `Available` (default), `Deployed`, `Destroyed`, `Decommissioned`
- **Status filter:** `GET /api/gadgets?status=...`, with validation against the allowed values
- **Soft delete:** `DELETE` sets `Decommissioned` and `decommissionedAt`
- **Self-destruct:** sets `Destroyed` and returns a six-character confirmation code
- **Interactive API docs** with `swagger-jsdoc` and `swagger-ui-express` (persisted authorization)
- **Render blueprint** (`render.yaml`) that provisions the web service and a PostgreSQL database

## Tech stack

| Area     | Tools                                                                   |
| -------- | ----------------------------------------------------------------------- |
| Runtime  | Node.js, Express 4                                                      |
| Database | PostgreSQL, Sequelize 6 (`pg`)                                          |
| Auth     | `jsonwebtoken`, `bcryptjs`                                              |
| Docs     | `swagger-jsdoc`, `swagger-ui-express`                                   |
| Other    | `cors`, `express-rate-limit`, `dotenv`, `nodemon` (dev)                 |
| Tests    | Node's built-in test runner, `supertest`, `pg-mem` (in-memory Postgres) |
| Hosting  | Render                                                                  |

## Project structure

```
imf-gadget-api/
├── server.js                 # Checks env vars, syncs the DB, starts the HTTP server
├── render.yaml               # Render blueprint (web service + Postgres)
├── test/api.test.js          # API tests against an in-memory database
└── src/
    ├── app.js                # Express app: CORS, rate limit, Swagger UI, routes, errors
    ├── config/
    │   ├── database.js       # Sequelize config per NODE_ENV (SSL in production)
    │   ├── env.js            # requireEnv(): fail fast on missing configuration
    │   └── swagger.js        # OpenAPI definition + servers
    ├── controllers/          # authController, gadgetController
    ├── middleware/auth.js    # Bearer JWT verification
    ├── models/               # User, Gadget (+ memoryDb.js used only by tests)
    ├── routes/               # authRoutes, gadgetRoutes (with JSDoc Swagger annotations)
    └── utils/helpers.js      # codename, confirmation code and UUID helpers
```

## Getting started

### Prerequisites

- Node.js and npm
- PostgreSQL

### Install and run

```bash
git clone https://github.com/VamsiKrishnaThota03/imf-gadget-api.git
cd imf-gadget-api
npm install
cp .env.example .env         # then fill in DATABASE_URL and JWT_SECRET
createdb imf_gadgets         # or create the database another way
npm run dev                  # nodemon; or: npm start
```

Swagger UI is then available at `http://localhost:3000/api-docs` (`/` redirects there). The server refuses to start if `DATABASE_URL` or `JWT_SECRET` is missing, and it listens on `127.0.0.1` unless `HOST` is set (on Render it binds `0.0.0.0` automatically).

### Environment variables (`.env`)

| Variable          | Required | Description                                                                                                    |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Yes      | PostgreSQL connection string                                                                                   |
| `JWT_SECRET`      | Yes      | Long random secret for signing and verifying JWTs (`openssl rand -hex 32`)                                     |
| `PORT`            | No       | HTTP port (default `3000`)                                                                                     |
| `HOST`            | No       | Bind address. Default `127.0.0.1`, or `0.0.0.0` when Render's `RENDER` variable is present                     |
| `NODE_ENV`        | No       | `development` (default), `test` or `production`                                                                |
| `JWT_EXPIRES_IN`  | No       | Token lifetime, e.g. `1d` (default), `12h`                                                                     |
| `DB_SSL`          | No       | `true` to use SSL for the DB connection. On by default when `NODE_ENV=production`; set `false` to turn it off  |
| `CORS_ORIGINS`    | No       | Comma-separated list of allowed browser origins. Unset = any origin (it is a bearer-token API with no cookies) |
| `AUTH_RATE_LIMIT` | No       | Max auth requests per IP per 15 minutes (default `50`)                                                         |

See [`.env.example`](.env.example).

### Scripts

| Command       | Description                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `npm start`   | `node server.js`                                                                                     |
| `npm run dev` | `nodemon server.js`                                                                                  |
| `npm test`    | 13 tests (Node test runner + supertest) against an in-memory Postgres emulation, no database needed |
| `npm run test:coverage` | Same, with coverage output |
| `npm run lint` | ESLint (flat config) |
| `npm run format:check` | Prettier, as CI runs it |

## API

All `/api/gadgets` routes need `Authorization: Bearer <token>`.

| Method | Path                             | Purpose                                                                                                                                |
| ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`             | Register an agent (`username` 3-50 chars, `password` at least 8 chars) and return the user and a token; `409` if the username is taken |
| POST   | `/api/auth/login`                | Log in and return a token                                                                                                              |
| GET    | `/api/gadgets`                   | List all gadgets (newest first) as `{ count, gadgets }`                                                                                |
| GET    | `/api/gadgets?status=Available`  | Filter by status (`Available`, `Deployed`, `Destroyed`, `Decommissioned`); returns 400 for an invalid status                           |
| POST   | `/api/gadgets`                   | Create a gadget (`name`); codename and success probability are generated                                                               |
| PATCH  | `/api/gadgets/:id`               | Update `name` and/or `status` (other fields return `400`)                                                                              |
| DELETE | `/api/gadgets/:id`               | Decommission (soft delete) and set `decommissionedAt`                                                                                  |
| POST   | `/api/gadgets/:id/self-destruct` | Mark as `Destroyed` and return `{ message, confirmationCode, gadget }`; `409` if already destroyed                                     |
| GET    | `/api-docs`                      | Swagger UI                                                                                                                             |
| GET    | `/health`                        | Health check (`{ "status": "ok" }`)                                                                                                    |

Unknown or malformed gadget IDs return `404`.

### Example

```http
POST /api/gadgets
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Laser Watch" }
```

```json
{
  "id": "6f1c...",
  "name": "Laser Watch",
  "codename": "The Phoenix",
  "status": "Available",
  "missionSuccessProbability": 85,
  "decommissionedAt": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Data models

| Model    | Fields                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `User`   | `id` (UUID), `username` (unique), `password` (bcrypt hash)                                                                          |
| `Gadget` | `id` (UUID), `name`, `codename` (unique), `status` (enum), `missionSuccessProbability` (float), `decommissionedAt` (date, nullable) |

## Local stack with Docker

```bash
printf 'POSTGRES_PASSWORD=%s\nJWT_SECRET=%s\n' \
  "$(openssl rand -hex 16)" "$(openssl rand -hex 32)" > .env

docker compose up --build
open http://localhost:3000/api-docs
```

Both published ports are bound to `127.0.0.1`, so nothing is reachable from your
network. Compose refuses to start with a named error if either variable is
missing, rather than falling back to a default password. The image is
multi-stage, runs as the unprivileged `node` user, carries no dev dependencies
and declares a `HEALTHCHECK`.

## Continuous integration

| Job | What it proves |
| --- | --- |
| `test` (Node 20, 22) | ESLint, Prettier, and 13 tests against pg-mem |
| `integration` | Boots the real server against a Postgres 16 service container, waits for liveness then readiness, registers an agent, creates and lists a gadget, and asserts a clean exit on `SIGTERM` |
| `resilience` | Points `DATABASE_URL` at a dead port and asserts the process stays alive, keeps `/health` green, answers 503 on `/api/gadgets`, and logs retries |
| `docker` | The image builds and refuses to start without `JWT_SECRET` |

CodeQL runs weekly and on every push; Dependabot groups weekly patch/minor npm
bumps and raises majors individually.

## Deployment (Render)

`render.yaml` defines a Node web service (`npm ci --omit=dev` / `npm start`, health check on `/health`) and a free PostgreSQL database named `imf_gadgets`. `DATABASE_URL` is wired from the database and `JWT_SECRET` is generated automatically. The database's empty `ipAllowList` keeps it off the public internet; the web service reaches it over Render's private network. To deploy it, create a new Blueprint in Render from this repository.

The health check targets `/health` (liveness) rather than `/health/ready` on
purpose: the service is *meant* to stay up while the database is waking, and
pointing the platform at readiness would restart it mid-retry.

**Free-tier Postgres expires after 30 days.** When that happens no code change
will bring the demo back — recreate the database in the Render dashboard (or
`render.yaml` Blueprint) and the API will reconnect on its own, without a
redeploy, because `connectWithRetry` never stops trying.

## Known limitations

- Tables are created with `sequelize.sync()` on startup; there are no migrations, so schema changes to an existing database must be applied by hand. Fine for two tables and a demo, but a service holding real data should use `sequelize-cli` migrations so a column rename cannot become a drop-and-recreate.
- `missionSuccessProbability` is generated once when a gadget is created and stored, not recalculated on each request.
- Any registered agent can see and modify every gadget (there are no roles or per-agent ownership).
- Logging out is client-side only: tokens stay valid until they expire.
- Rate limit counters live in process memory, so the limit is per instance. Scaling beyond one would need a shared store (Redis) for it to hold globally.
- CORS defaults to allowing any origin because this is a bearer-token API with no cookies. Set `CORS_ORIGINS` to a comma-separated list to restrict browser callers.
