# Course Management

Monorepo with a **Next.js 15** full-stack app in `web/` (App Router UI + REST `/api/*` + Prisma 5 + MySQL), plus an optional **ASP.NET Core** API in the repo root for reference.

Recommended path for coursework: run the **Next.js** app — it owns the schema (`web/prisma/`), JWT session cookies, and CRUD for all entities.

---

## Quick start (`web/` + MySQL)

### Prerequisites

- **Node.js 20+** and npm
- **MySQL 8** (local install or Docker)
- (**Optional**) .NET 10 SDK — only if you run the legacy API

### 1. Database

From the **repository root**:

```bash
docker compose up -d
```

This starts MySQL on port `3306` with database `coursemanagement` (see `docker-compose.yml`).

### 2. Environment

```bash
cd web
cp .env.example .env
```

Edit `web/.env` if your MySQL credentials differ. You **must** set a strong **`JWT_KEY`** for production.

| Variable       | Purpose                          |
|----------------|----------------------------------|
| `DATABASE_URL` | MySQL connection string           |
| `JWT_KEY`      | Secret for signing session JWTs   |
| `JWT_ISSUER`   | Optional JWT issuer (`iss`)      |
| `JWT_AUDIENCE` | Optional JWT audience (`aud`)    |

### 3. Install and sync schema

```bash
npm install
```

Then either apply **migration history** (CI / shared DB):

```bash
npm run db:deploy
npm run db:seed
```

Or push the schema directly in dev (simplest first run):

```bash
npm run setup:dev
```

`setup:dev` runs `prisma generate`, `db push`, and `db seed`.

### 4. Run the app

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**. Sign in with **`admin@uni.com` / `password123`** (after seed), or use **Register** for new accounts (`Students` receive role `Student`).

---

## `web/` npm scripts

| Script        | Command                    | Use case |
|---------------|----------------------------|----------|
| `dev`         | Next dev server (Turbopack) | Daily dev |
| `build`       | `prisma generate` + prod build | Production |
| `start`       | `next start`               | Run after `build` |
| `lint`        | ESLint                     | CI / quality |
| `setup:dev`   | generate + db push + seed  | Fresh local DB |
| `db:push`     | `prisma db push`           | Dev: sync schema without migration files |
| `db:migrate`  | `prisma migrate dev`       | Dev: create/apply migrations |
| `db:deploy`   | `prisma migrate deploy`    | Prod/CI apply migrations |
| `db:seed`     | `prisma db seed`           | Load demo admin + sample data |
| `db:generate` | `prisma generate`          | Refresh client |

`postinstall` runs **`prisma generate`** automatically after `npm install`.

---

## Authentication (Next app)

- Login and registration set an **HTTP-only** cookie **`cm_session`** (JWT).
- **Axios** is configured with **`withCredentials: true`** for same-origin API calls.
- **Middleware** protects page routes (not `/api`); `/api` returns `401` JSON when unauthenticated.
- Bearer `Authorization` is still accepted by API handlers for tooling (optional).

Further detail for demos or grading: `web/TUTOR_PROJECT_DISCUSSION.md`.

---

## Entity model (Prisma)

- **User** — app login (`Users` table; bcrypt passwords)
- **Instructor**, **InstructorProfile** (1:1)
- **Course** — belongs to **Instructor**
- **Student**
- **Enrollment** — Student ↔ Course (grade, enrolled date)

---

## Legacy ASP.NET API

If you still use it:

1. `DATABASE_URL` / MySQL must match the schema Prisma created (tables `Instructors`, `Courses`, etc.).
2. From repo root: `dotnet restore` → `dotnet run`  
3. Typical URL: **`http://localhost:5007`** (see your launch profile).

Swagger / JWT flow on .NET differs from the Next cookie flow; coursework deliverable assumes the **`web`** app unless your brief says otherwise.

---

## Technology summary

| Area        | Stack |
|------------|--------|
| Primary UI + API | Next.js 15, React 19, Tailwind 4 |
| HTTP client | Axios |
| Persistence | Prisma 5, MySQL 8 |
| Auth | jose (JWT), HTTP-only cookie, bcryptjs |
| Optional | ASP.NET Core 10, EF Core |
