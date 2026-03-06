# Quickstart

This repository currently implements the `Profile Manager` feature as the first vertical slice of the larger job-hunting automation system.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## 1. Create the database

Create a PostgreSQL database named `job_hunter`.

Run the schema:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

## 2. Configure environment variables

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Required values:

- `DATABASE_URL`
- `PORT`
- `FRONTEND_ORIGIN`
- `BACKEND_URL`

## 3. Install dependencies

```bash
npm install
```

## 4. Run the backend

```bash
npm run dev:backend
```

The API will start on `http://localhost:4000`.

## 5. Run the frontend

```bash
npm run dev:frontend
```

Open `http://localhost:3000/profile`.

## Implemented endpoints

- `GET /health`
- `GET /api/profile-fields`
- `PUT /api/profile-fields/:key`
- `DELETE /api/profile-fields/:key`

## Implemented docs

- [docs/profile-manager.md](/home/akash/AutoApply/docs/profile-manager.md)
- [database/schema.sql](/home/akash/AutoApply/database/schema.sql)

