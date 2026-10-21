# Hotel Management System

A full-stack hotel management system: staff auth & roles, room booking & availability, guest & check-in/out management, billing & invoicing, and room/staff inventory administration.

## Stack

- **Client**: React 19 + Vite + TypeScript, TanStack Query, React Router, React Hook Form + Zod, Tailwind CSS v4
- **Server**: Node.js + Express + TypeScript, Prisma ORM, JWT (httpOnly cookie) auth, bcrypt
- **Database**: PostgreSQL (via Docker Compose)
- **Tests**: Vitest + Supertest (backend integration tests)

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres)

## Setup

```bash
npm install
docker compose up -d          # start Postgres
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:migrate            # apply Prisma migrations
npm run db:seed               # seed demo data (rooms, guests, staff accounts)
npm run dev                   # runs server (:4000) and client (:5173) together
```

Open http://localhost:5173.

### Demo accounts

| Role       | Email                   | Password  |
|------------|-------------------------|-----------|
| Admin      | admin@hotel.local       | admin123  |
| Front desk | frontdesk@hotel.local   | staff123  |

## Deployment

See [DEPLOY.md](DEPLOY.md) for deploying to Render (one web service plus a PostgreSQL database).

## Project layout

```
server/   Express API (routes → services → Prisma), Prisma schema & migrations
client/   React SPA (pages, API hooks, auth context)
postman/  Postman collection covering every API endpoint
```

## Testing

```bash
npm test   # backend integration tests (auth, reservation overlap logic, billing totals)
```

Tests run against a separate `hotel_test` database. Create it once if it doesn't exist:

```bash
docker exec hotel_postgres psql -U postgres -c "CREATE DATABASE hotel_test;"
```

## API

See [postman/hotel-management-system.postman_collection.json](postman/hotel-management-system.postman_collection.json) for every endpoint, importable directly into Postman. Auth uses an httpOnly session cookie set by `POST /api/v1/auth/login` — Postman's cookie jar (and the browser) handle it automatically.
