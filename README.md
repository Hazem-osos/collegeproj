# Course Management

Monorepo with a **Next.js 15** full-stack app in `web/` (App Router UI + REST `/api/*` + Prisma 5 + MySQL), plus an optional **ASP.NET Core** API in the repo root for reference.

The Next app owns the schema (`web/prisma/`): **Admin** manages courses, instructors, students, enrollments, and profiles. **Registered students** get a roster row (`Students`) linked to **`Users.StudentId`** and only see **My courses** (+ **Settings**).

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

Starts MySQL on port `3306`, database **`coursemanagement`** (`docker-compose.yml`).

### 2. Environment

```bash
cd web
cp .env.example .env
```

Edit `web/.env` if credentials differ. Set a strong **`JWT_KEY`** for production.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_KEY` | Secret for JWT session signing |
| `JWT_ISSUER` | Optional JWT `iss` claim |
| `JWT_AUDIENCE` | Optional JWT `aud` claim |

### 3. Install and sync schema

```bash
npm install
```

Then choose one:

- **Migrate + seed** (teams / CI):  
  `npm run db:deploy && npm run db:seed`

- **Push + seed** (fast local):  
  `npm run setup:dev`  
  (`prisma generate`, `db push`, `db seed`)

If `db push` warns about adding a **`StudentId`** unique index on **`Users`**, you can use:

`npx prisma db push --accept-data-loss`  
(multiple **NULL** `StudentId`s for admins remain valid in MySQL.)

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:3000**

- **Admin:** `admin@uni.com` / `password123` (after seed) → full dashboard, CRUD modules, enrollments.
- **Student:** **Register** (full name + email + password) → adds a **`Students`** row and links **`Users`**. Admins enroll them via **Enrollments**. Students use **My courses** (instructor name per course) and **Settings** (password + display name).

---

## Roles & routing (Next app)

| Role | Pages | APIs |
|------|-------|------|
| **Admin** | `/`, `/courses`, `/instructors`, `/students`, `/enrollments`, `/instructor-profiles`, **`/settings`** | All management CRUD + auth |
| **Student** | **`/my-courses`**, **`/settings`** only | `GET /api/me/enrollments`, `PATCH /api/me/profile`, `POST /api/auth/password`, plus `/api/auth/me` |

Middleware blocks students from admin URLs (redirect to **`/my-courses`**). Management **`/api/*`** returns **403** for non-admins (`requireAdminDb`).

---

## `web/` npm scripts

| Script | Use |
|--------|-----|
| `dev` | Next dev (Turbopack) |
| `build` / `start` | Production |
| `lint` | ESLint |
| `setup:dev` | `generate` + `db push` + `db seed` |
| `db:push` | Sync schema without new migration files |
| `db:migrate` | Create / apply migrations in dev |
| `db:deploy` | Apply migrations (CI / prod) |
| `db:seed` | Demo admin + sample instructor/course |

`postinstall` runs **`prisma generate`**.

---

## Authentication (Next app)

- Session: **HTTP-only** cookie **`cm_session`** (JWT). **Axios** uses **`withCredentials: true`**.
- **Middleware** protects page routes (not **`/api`**). **`POST /api/auth/logout`** clears the cookie.
- Optional **Bearer** header still works for tooling.

---

## Entity model (Prisma)

- **User** — login (`Users`; bcrypt; optional **`StudentId`** → **Student**)
- **Instructor**, **InstructorProfile** (1:1)
- **Course**
- **Student**
- **Enrollment** — links **Student** ↔ **Course** (grade, enrolled date)

---

## Legacy ASP.NET API

Optional root **CourseManagementAPI** project. Same MySQL as Prisma if you align schema. `dotnet restore` → `dotnet run` (often **http://localhost:5007**). Cookie session and role model differ from **`web/`**.

---

## Technology summary

| Area | Stack |
|------|--------|
| UI + API | Next.js 15, React 19, Tailwind 4 |
| HTTP | Axios |
| DB | Prisma 5, MySQL 8 |
| Auth | jose (JWT), HTTP-only cookie, bcryptjs |
| Optional | ASP.NET Core 10, EF Core |
