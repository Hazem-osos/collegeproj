# Course Management — Next.js app

End-to-end UI + `/api` + Prisma + MySQL.

## First-time setup

1. **`cp .env.example .env`**
2. MySQL: from repo root **`docker compose up -d`** (or your own instance).
3. **`npm install`** (runs **`prisma generate`** via `postinstall`).
4. Sync DB + seed:
   - **`npm run setup:dev`** — push schema + seed (quickest), or  
   - **`npm run db:deploy`** then **`npm run db:seed`** — migrations.
5. **`npm run dev`** → http://localhost:3000

## Roles

- **Admin** — dashboard + all CRUD pages; enroll students into courses.
- **Student** — register (creates **`Students`** + linked **`Users`**); **`/my-courses`** + **`/settings`** only.

## Scripts

`dev`, `build`, `start`, `lint`, `setup:dev`, `db:push`, `db:migrate`, `db:deploy`, `db:seed`, `db:generate` — see **`package.json`**.

## Docs

- **[../README.md](../README.md)** — full repo guide  
- **`TUTOR_PROJECT_DISCUSSION.md`** — assignment / tutor walk-through
