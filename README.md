# CNPM Backend

Express + TypeScript REST API for a multi-vendor e-commerce platform. It covers authentication, RBAC, shop management, product catalog (SPU/SKU), inventory, cart & checkout, orders, discounts, delivery, image uploads (S3), and real-time notifications (WebSocket).

All HTTP routes are mounted under `/api/v1`.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project summary](#project-summary)
- [Architecture & design patterns](#architecture--design-patterns)
- [Project structure](#project-structure)
- [Code conventions](#code-conventions)
- [Prerequisites](#prerequisites)
- [Getting started from scratch](#getting-started-from-scratch)
- [Available scripts](#available-scripts)
- [API surface](#api-surface)
- [Seed data & demo accounts](#seed-data--demo-accounts)
- [Postman collection](#postman-collection)
- [Docker (production)](#docker-production)
- [Further reading](#further-reading)

---

## Tech stack

| Technology | Role in this project |
| --- | --- |
| **Node.js 20+** | Runtime. Dockerfile uses `node:20-alpine`. |
| **TypeScript** | Strict typing across the codebase. Compiled to `dist/` for production. |
| **Express** | HTTP server, routing, middleware pipeline. |
| **TypeORM** | ORM for MySQL. Entities in `src/domain/entities`, migrations in `src/domain/migrations`. `synchronize: false` — schema changes go through migrations only. |
| **MySQL** (`mysql2`) | Primary relational store (users, shops, products, orders, …). |
| **Redis** (`ioredis`) | RBAC permission cache, rate limiting, notification pub/sub across instances. |
| **AWS S3 SDK v3** | Presigned URL uploads for user/shop/product images. |
| **Joi** | Request validation in `*.schema.ts`, wired through the `validator` middleware. |
| **jsonwebtoken** | Access & refresh tokens. Payload: `{ userId, roleId, assignedShopId? }`. |
| **bcrypt** | Password hashing (`@shared/utils/password`). |
| **Winston** | Structured logging with daily rotate files under `logs/`. |
| **OpenTelemetry** | Optional tracing/logs export (`src/tracing.ts`, loaded in production via `yarn start`). |
| **WebSocket** (`ws`) | Real-time notification hub at `/ws/notifications`. |
| **Nodemailer** | Account activation and password-reset emails. |
| **node-cron** | Background schedulers (e.g. stale image cleanup in `src/schedulers/`). |
| **rate-limiter-flexible** | Per-route and global rate limits backed by Redis. |
| **ESLint + Prettier + Husky** | Lint/format on commit via `lint-staged`. |
| **Yarn** | Package manager (`yarn.lock`). |

---

## Project summary

This backend powers a marketplace where:

- **Customers** browse products, manage carts, apply discounts, place orders, and receive notifications.
- **Shop owners & staff** manage catalog, inventory, warehouses, addresses, and shop-scoped discounts under `/api/v1/shop`.
- **Admins** manage global categories, roles/permissions, users, and shop approval under `/api/v1/admin`.
- **Guests** can access public catalog and auth endpoints under `/api/v1` (root public router).

On first startup (empty database), the app automatically seeds reference data (roles, permissions, categories, delivery zones) and a demo dataset (users, shops, products, sample orders). See [Seed data & demo accounts](#seed-data--demo-accounts).

Entity relationships are documented in [`docs/dbs/relations.md`](docs/dbs/relations.md).

---

## Architecture & design patterns

### Layered request flow

```
HTTP Request
  → Express middleware (cors, json, context, transaction, rate limit, morgan)
  → Router (rateLimit → authenticator → validator → rbac → controller)
  → Controller (extract DTO, inject JWT identity, call service)
  → Service (business rules, orchestration)
  → Repository (TypeORM queries)
  → MySQL
```

### Key patterns

| Pattern | Where | Purpose |
| --- | --- | --- |
| **Layered architecture** | `router → controller → service → repository` | Separation of transport, business logic, and persistence. |
| **Singleton services** | `const xService = new XService(); export default xService` | One shared instance per module. |
| **Base classes** | `Base`, `BaseService`, `BaseRepository` | Shared logger, config, Redis, repositories, and per-request query runner. |
| **Repository pattern** | `src/domain/repositories` | Encapsulates TypeORM access; services never instantiate repositories directly. |
| **DTO + Joi schema** | `*.dto.ts` + `*.schema.ts` | Contract types vs. runtime validation. |
| **Decorator responses** | `@OkResponse()`, `@CreatedResponse()` | Consistent `HttpResponse` envelope. |
| **RBAC middleware** | `rbac([PERMISSIONS.X])` | Permission checks per route; cached in Redis. |
| **Per-request transaction** | `contextMiddleware` + `transactionMiddleware` | Every HTTP request runs inside a DB transaction (commit on 2xx, rollback otherwise). |
| **Async local storage** | `RequestContextService` | Request-scoped JWT, query runner, request ID. |
| **Module boundaries** | ESLint `no-restricted-imports` | API modules cannot import each other's services. |
| **Audience-split routers** | `public.router.ts`, `shop.router.ts`, `admin.router.ts` | Same domain (e.g. address, discount) exposed under different URL prefixes with different permissions. |

### Middleware order

**App-level** (`src/app.ts`):

1. `cors` → `express.json` → `contextMiddleware` → `transactionMiddleware` → `requestTracker` → `appRateLimit` → `morgan` → `/api/v1` router → `handleNotFound` → `handleError`

**Per-route** (RBAC-gated endpoints):

```
rateLimit → authenticator → validator → rbac → asyncWrapper(controller)
```

Public auth routes (login, sign-up): `validator → rateLimit → asyncWrapper`.

### JWT-scoped identity

Request bodies, queries, and params must **not** contain `userId`, `shopId`, or `ownerId`. Controllers inject them from `RequestContextService.getJwtPayload()`. Joi rejects unknown keys by default, so spoofed identity fields return 400.

---

## Project structure

```
src/
├── api/                  # HTTP modules (router, controller, service, dto, schema, constants)
│   ├── app.router.ts     # Mounts /health-check, /admin, /shop, public routes
│   ├── admin.router.ts
│   ├── shop.router.ts
│   └── public.router.ts
├── config/               # Env validation (Joi) → typed Config
├── domain/
│   ├── db/               # MySQL DataSource, Redis, S3 clients
│   ├── entities/         # TypeORM entities
│   ├── migrations/       # Schema migrations (run manually)
│   ├── repositories/     # Data access layer
│   └── seed/             # Reference + demo data (runs on startup)
├── schedulers/           # Cron jobs (e.g. image lifecycle)
├── shared/               # Middleware, RBAC, HTTP helpers, utils, constants
├── ws/                   # WebSocket notification hub
├── app.ts                # Express app setup
├── index.ts              # HTTP server entrypoint
└── tracing.ts            # OpenTelemetry bootstrap (production)
docs/
├── dbs/relations.md      # Entity & FK reference
└── postman/              # Postman collection
```

Path aliases (see `tsconfig.json`): `@api`, `@config`, `@domain`, `@shared`, `@ws`, `@schedulers`.

---

## Code conventions

Detailed rules live in [`.cursor/rules/`](.cursor/rules/) (`architecture.mdc`, `style.mdc`). Summary:

- **Strict TypeScript** with path aliases; no `console.*` — use `this.logger` or `appLogger`.
- **Alphabetical ordering** enforced by `eslint-plugin-perfectionist` (imports, object keys, class members).
- **Validation in schemas**, not services. Services only validate what requires DB/Redis/JWT lookups (existence, ownership, state transitions).
- **Internal types** in `<module>.type.ts`, not at the top of `*.service.ts`. DTOs stay in `*.dto.ts`.
- **Constants** in `<module>.constants.ts` — no magic numbers/strings in services or routers.
- **Errors** via `BadRequestError`, `NotFoundError`, etc. from `@shared/lib/http/httpError` — never `res.status().json()` in services.
- **External library errors**: duck-type on `.name` / `.code`, not `instanceof`.
- **Max 45 lines per function** (excluding blanks/comments) — extract private `_helpers` when needed.
- **Transactions**: do not wrap HTTP work in `AppDataSource.transaction()`; the per-request runner handles it. Use `AppDataSource.transaction` only in seed/CLI scripts.
- After changes: `npx tsc --noEmit` and `npx eslint <files>`.

---

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js** ≥ 20 | Matches `Dockerfile`. |
| **Yarn** | `corepack enable` or install globally. |
| **MySQL** 8.x | Create an empty database before migrating. |
| **Redis** 6+ | Used for RBAC cache, rate limits, notification pub/sub. |
| **S3-compatible storage** | AWS S3 or MinIO for image uploads. |
| **SMTP credentials** | For activation / password-reset emails (Gmail app password, etc.). |

---

## Getting started from scratch

### 1. Clone and install

```bash
git clone <repository-url>
cd Be
yarn install
```

### 2. Provision infrastructure

Create a MySQL database (example):

```sql
CREATE DATABASE cnpm_be CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Start Redis locally or via your preferred method. For S3, use AWS or run [MinIO](https://min.io/) locally and create a bucket.

### 3. Configure environment

Copy the example file and fill in all required values:

```bash
cp .env.example .env
```

Required variables (validated at startup in `src/config/index.ts`):

```env
# Server
PORT=3000
NODE_ENV=DEV
FRONTEND_URL=http://localhost:5173

# MySQL
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=cnpm_be

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_USERNAME=
REDIS_PASSWORD=

# JWT
ACCESS_TOKEN_SECRET_KEY=change-me-access-secret
REFRESH_TOKEN_SECRET_KEY=change-me-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# S3
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=cnpm-images
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin

# Email (Nodemailer)
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=your-app-password
```

> `NODE_ENV` must be one of `DEV`, `STAG`, or `PROD`.

### 4. Run database migrations

Migrations are **not** applied automatically. Run them before starting the server:

```bash
yarn migration:run:dev
```

This executes all pending migrations in `src/domain/migrations/` against the database configured in `.env`.

To create a new migration after changing entities:

```bash
yarn migration:create src/domain/migrations/<descriptive-name>
```

Then implement `up` / `down` in the generated file and run `yarn migration:run:dev` again.

### 5. Start the development server

```bash
yarn dev
```

Nodemon watches `src/` and `.env`, running via `ts-node` with path aliases.

On startup:

1. TypeORM connects to MySQL.
2. Seed runs (`src/domain/seed/index.ts`): roles/permissions, categories, delivery catalog, then demo users/shops/products/orders if tables are empty.

Verify the server:

```bash
curl http://localhost:3000/api/v1/health-check
```

### 6. Production build (optional)

```bash
yarn build
yarn start
```

`yarn start` loads OpenTelemetry tracing from `dist/tracing.js` before the app.

---

## Available scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Start dev server with hot reload (nodemon). |
| `yarn build` | Compile TypeScript to `dist/` (with `tsc-alias` for path aliases). |
| `yarn start` | Run compiled app in production mode. |
| `yarn migration:run:dev` | Apply pending TypeORM migrations (development). |
| `yarn migration:create <path>` | Scaffold a new migration file. |

---

## API surface

Base URL: `http://localhost:3000/api/v1`

| Prefix | Audience | Examples |
| --- | --- | --- |
| `/health-check` | Public | Liveness probe |
| `/auth`, `/user`, `/cart`, `/order`, `/product`, … | Authenticated users / guests | Customer flows |
| `/shop/*` | Shop owner & staff | Catalog, inventory, warehouse, shop discounts |
| `/admin/*` | Platform admin | Users, roles, global categories, shop approval |

WebSocket notifications: connect to `ws://localhost:3000/ws/notifications` with a valid access token.

---

## Seed data & demo accounts

After migrations, the first `yarn dev` (or `yarn start`) seeds data when tables are empty.

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Password1!` |
| Platform moderator | `moderator@example.com` | `Password1!` |
| Customer | `user1@example.com` … `user10@example.com` | `Password1!` |
| Shop owner | `owner.aurora@example.com`, `owner.mekong@example.com`, … | `Password1!` |
| Shop moderator | `mod.aurora@example.com`, `mod.mekong@example.com`, … | `Password1!` |
| Shop staff | `staff.aurora1@example.com`, … | `Password1!` |

Demo shops include Aurora Electronics, Mekong Threads, Hanoi Hearth, Lotus Beauty, and Annam Outdoors. The seed creates **8 products per shop** (with variants), **10 global discount codes**, and **sample orders in every lifecycle status** (`pending` through `completed`, plus `cancelled`) — see `src/domain/seed/fixtures.ts`.

---

## Postman collection

Import [`docs/postman/cnpm-be.postman_collection.json`](docs/postman/cnpm-be.postman_collection.json) into Postman. It documents request shapes and example flows. Keep it in sync when adding or changing routes.

---

## Docker (production)

A `Dockerfile` builds and runs the compiled app. `docker-compose.yml` exposes port 3000 for the application container only — **MySQL, Redis, and S3 must be provided separately** (or extend compose yourself).

```bash
docker compose up --build
```

Set `NODE_ENV=PROD` and inject all required env vars into the container.

---

## Project documentation

Báo cáo môn **Công nghệ Phần mềm Mới** (theo template `docs/business/Template.docx`):

📄 [Download báo cáo (DOCX)](./docs/business/CNPM-BaoCao.docx)

Tài liệu kỹ thuật bổ sung: [`docs/dbs/relations.md`](docs/dbs/relations.md) · Postman: [`docs/postman/cnpm-be.postman_collection.json`](docs/postman/cnpm-be.postman_collection.json)

Regenerate sau khi cập nhật code:

```bash
python3 -m venv .venv-docgen && .venv-docgen/bin/pip install python-docx
.venv-docgen/bin/python docs/scripts/generate-cnpm-report.py
```

---

## Further reading

- [`docs/dbs/relations.md`](docs/dbs/relations.md) — database entities, FK behavior, and domain map
- [`.cursor/rules/architecture.mdc`](.cursor/rules/architecture.mdc) — layer responsibilities, middleware order, RBAC
- [`.cursor/rules/style.mdc`](.cursor/rules/style.mdc) — TypeScript, validation, errors, constants
