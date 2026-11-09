# IMF Gadget API

A Mission: Impossible-themed REST API for managing an IMF gadget inventory. It has JWT-authenticated agents, auto-generated codenames, mission success probabilities, soft decommissioning and a self-destruct endpoint. Built with Express, PostgreSQL and Sequelize, and documented with Swagger.

![Node.js](https://img.shields.io/badge/Node.js-Express%204-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Sequelize%206-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/auth-JWT-000000?logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/docs-Swagger-85EA2D?logo=swagger&logoColor=black)
![Render](https://img.shields.io/badge/deployed%20on-Render-46E3B7?logo=render&logoColor=black)

## Live demo

- Swagger UI: **https://imf-gadget-api-dhbc.onrender.com/api-docs**
- Base URL: `https://imf-gadget-api-dhbc.onrender.com`

## Overview

Agents register and log in with a username and password and get a JWT. Every gadget endpoint requires that token. When a gadget is created it gets a random codename (for example "The Phoenix" or "Operation Kraken") and a random mission success probability between 60 and 100. Deleting a gadget is a soft delete: it is marked `Decommissioned` with a timestamp. The self-destruct endpoint marks it `Destroyed` and returns a random confirmation code. Sequelize creates the tables automatically on startup (`sequelize.sync()`).

## Features

- **JWT authentication:** register and log in with bcrypt-hashed passwords; send `Authorization: Bearer <token>` on gadget routes
- **Gadget CRUD**, with gadget IDs as UUIDs
- **Automatic codenames:** a random prefix (The / Project / Operation) plus a random noun, enforced unique at the database level
- **Mission success probability:** a random whole number from 60 to 100, assigned on creation
- **Status lifecycle:** `Available` (default), `Deployed`, `Destroyed`, `Decommissioned`
- **Status filter:** `GET /api/gadgets?status=...`, with validation against the allowed values
- **Soft delete:** `DELETE` sets `Decommissioned` and `decommissionedAt`
- **Self-destruct:** sets `Destroyed` and returns a six-character confirmation code
- **Interactive API docs** with `swagger-jsdoc` and `swagger-ui-express` (persisted authorization)
- **Render blueprint** (`render.yaml`) that provisions the web service and a PostgreSQL database

## Tech stack

| Area | Tools |
| --- | --- |
| Runtime | Node.js, Express 4 |
| Database | PostgreSQL, Sequelize 6 (`pg`) |
| Auth | `jsonwebtoken`, `bcryptjs` |
| Docs | `swagger-jsdoc`, `swagger-ui-express` |
| Other | `uuid`, `cors`, `dotenv`, `nodemon` (dev) |
| Hosting | Render |

## Project structure

```
imf-gadget-api/
├── server.js                 # Express app, Swagger UI, routes, DB sync
├── render.yaml               # Render blueprint (web service + Postgres)
└── src/
    ├── config/
    │   ├── database.js       # Sequelize config per NODE_ENV (SSL in production)
    │   └── swagger.js        # OpenAPI definition + servers
    ├── controllers/          # authController, gadgetController
    ├── middleware/auth.js    # Bearer JWT verification
    ├── models/               # User, Gadget
    ├── routes/               # authRoutes, gadgetRoutes (with JSDoc Swagger annotations)
    └── utils/helpers.js      # codename + confirmation code generators
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
createdb imf_gadgets         # or create the database another way
npm run dev                  # nodemon; or: npm start
```

Swagger UI is then available at `http://localhost:3000/api-docs`.

### Environment variables (`.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing and verifying JWTs |
| `PORT` | No | HTTP port (default `3000`) |
| `NODE_ENV` | No | `development` (default), `test` or `production`. In production, SSL is used for the DB connection. |

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/imf_gadgets
JWT_SECRET=<a-long-random-secret>
PORT=3000
NODE_ENV=development
```

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | `node server.js` |
| `npm run dev` | `nodemon server.js` |

## API

All `/api/gadgets` routes need `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register an agent (`username`, `password`) and return the user and a token |
| POST | `/api/auth/login` | Log in and return a token |
| GET | `/api/gadgets` | List all gadgets as `{ count, gadgets }` |
| GET | `/api/gadgets?status=Available` | Filter by status (`Available`, `Deployed`, `Destroyed`, `Decommissioned`); returns 400 for an invalid status |
| POST | `/api/gadgets` | Create a gadget (`name`); codename and success probability are generated |
| PATCH | `/api/gadgets/:id` | Update a gadget (for example `status`) |
| DELETE | `/api/gadgets/:id` | Decommission (soft delete) and set `decommissionedAt` |
| POST | `/api/gadgets/:id/self-destruct` | Mark as `Destroyed` and return `{ message, confirmationCode, gadget }` |
| GET | `/api-docs` | Swagger UI |

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

| Model | Fields |
| --- | --- |
| `User` | `id` (UUID), `username` (unique), `password` (bcrypt hash) |
| `Gadget` | `id` (UUID), `name`, `codename` (unique), `status` (enum), `missionSuccessProbability` (float), `decommissionedAt` (date, nullable) |

## Deployment (Render)

`render.yaml` defines a Node web service (`npm install` / `npm start`) and a free PostgreSQL database named `imf_gadgets`. `DATABASE_URL` is wired from the database and `JWT_SECRET` is generated automatically. To deploy it, create a new Blueprint in Render from this repository.
