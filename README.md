# Course Management

Monorepo with a **Next.js 15** full-stack app in **`web/`** (App Router UI + REST `/api/*` + Prisma 5 + MySQL) and an **ASP.NET Core** API in the **repository root** that can serve the same schema.

The **Next app owns the database schema** (`web/prisma/`): **Admin** manages courses, instructors, students, enrollments, and profiles. **Registered students** get a roster row (`Students`) linked to **`Users.StudentId`** and only see **My courses** and **Settings**.

Optional: point the UI at the ASP.NET API for **login + admin CRUD** by setting **`NEXT_PUBLIC_DOTNET_API_URL`** (see below).

Arabic project overview: **`PROJECT_OVERVIEW_AR.md`**.

---

## Quick start (`web/` + MySQL)

### Prerequisites

- **Node.js 20+** and npm  
- **MySQL 8** (local install or Docker)  
- **Optional:** **.NET 10 SDK** — for the ASP.NET API at the repo root  

### 1. Database

From the **repository root**:

```bash
docker compose up -d
```

Starts MySQL on port **3306**, database **`coursemanagement`** (see `docker-compose.yml`). Docker uses **`root` / `devpassword`** by default.

### 2. Environment (`web/`)

```bash
cd web
cp .env.example .env
```

Edit **`web/.env`**:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL URL (must match your real MySQL user/password) |
| `JWT_KEY` | Secret for signing JWTs; **must be at least ~32 characters** (256 bits) for HS256 used by Next and ASP.NET |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Match **`Jwt:Issuer`** / **`Jwt:Audience`** in root **`appsettings.json`** if you use the .NET API or bootstrap session |
| `NEXT_PUBLIC_DOTNET_API_URL` | Optional, e.g. `http://localhost:5007`. When set, **login + admin** REST calls go to ASP.NET with **Bearer**; student routes (`/api/me/*`), **register**, and **password change** stay on Next. |

If you enable **`NEXT_PUBLIC_DOTNET_API_URL`**, align **`JWT_*`** with root **`appsettings.json`** **`Jwt`** section exactly.

### 3. Install and sync schema

```bash
cd web
npm install
```

Then either:

- **Teams / CI:** `npm run db:deploy && npm run db:seed`
- **Fast local:** `npm run setup:dev` (generate, `db push`, seed)

If `db push` warns about **`StudentId`** unique index on **`Users`**, you may use `npx prisma db push --accept-data-loss` (multiple NULL `StudentId` for admins is valid in MySQL).

### 4. Run the Next app

```bash
cd web
npm run dev
```

Open **http://localhost:3000**

- **Admin:** `admin@uni.com` / `password123` (after seed) → full dashboard and CRUD.  
- **Student:** **Register** → roster profile; admins enroll students; students use **My courses** and **Settings**.

---

## Optional: ASP.NET API and wiring the UI to it

### Run the API

From the **repository root** (not `web/`):

```bash
dotnet restore
dotnet run --launch-profile http
```

Default URL: **http://localhost:5007**. Use Scalar/OpenAPI from the URLs printed in the console.

### Configuration

- **`appsettings.json`** — **`ConnectionStrings:DefaultConnection`**: same MySQL **user/password/database** as **`DATABASE_URL`** in **`web/.env`**. If you use Docker as documented, password is **`devpassword`**; adjust if your local MySQL differs.
- **`Jwt:Key`** in **`appsettings.json`** must match **`JWT_KEY`** in **`web/.env`** and be **long enough for HS256** (the sample key is ≥ 32 characters).
- The project uses **EF Core 9** with **Pomelo.EntityFrameworkCore.MySql 9.x** (aligned versions). Server version is fixed to **MySQL 8.0.x** in **`Program.cs`** (no `ServerVersion.AutoDetect` at startup).

### Enable the Next.js client to call ASP.NET

In **`web/.env`**:

```env
NEXT_PUBLIC_DOTNET_API_URL=http://localhost:5007
```

Restart **`npm run dev`**. After **login**, the app stores the JWT for **Bearer** requests and calls **`POST /api/auth/bootstrap-session`** on Next to mirror the cookie **`cm_session`** for page middleware.

---

## Roles & routing (Next app)

| Role | Pages | APIs |
|------|-------|------|
| **Admin** | `/`, `/courses`, `/instructors`, `/students`, `/enrollments`, `/instructor-profiles`, `/settings` | Management CRUD + auth |
| **Student** | `/my-courses`, `/settings` | `GET /api/me/enrollments`, `PATCH /api/me/profile`, `POST /api/auth/password`, `/api/auth/me` |

Middleware blocks students from admin URLs (`requireAdminDb` on management APIs).

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

## Authentication

- Session cookie **`cm_session`** (JWT, HTTP-only). Axios uses **`withCredentials: true`** for same-origin Next APIs.
- Optional **Bearer** for the ASP.NET host when **`NEXT_PUBLIC_DOTNET_API_URL`** is set.

---

## Entity model (Prisma)

- **User** — login (`Users`; bcrypt; optional **`StudentId`** → **Student**)
- **Instructor**, **InstructorProfile** (1:1)
- **Course**, **Student**, **Enrollment**

---

## Technology summary

| Area | Stack |
|------|--------|
| UI + API | Next.js 15, React 19, Tailwind 4 |
| HTTP | Axios (optional second origin for ASP.NET) |
| DB | Prisma 5, MySQL 8 |
| Auth | jose (JWT), HTTP-only cookie, bcryptjs |
| Optional backend | ASP.NET Core 10, EF Core 9, Pomelo MySQL, BCrypt.Net-Next |
