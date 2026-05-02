# Web Engineering Project — Discussion Notes for Your Tutor

This document summarizes what was built in the Next.js frontend (`web/`), how it maps to your assignment checklist, and what you need to run locally (database + auth).

---

## Stack (as requested)

| Requirement | Implementation |
|-------------|----------------|
| Next.js App Router | `src/app/` with route groups `(main)` for authenticated shell |
| React functional components | All pages; `"use client"` where forms, Axios, hooks, and modals are used |
| **Axios** | `src/lib/axios-instance.ts` — singleton with `withCredentials: true` for cookie sessions |
| `useState` / `useEffect` | Listing data, forms, dialogs, auth bootstrap |

---

## Routing & Navigation

Public (no JWT cookie enforced by middleware):

- **`/login`** — Sign-in; Axios `POST /api/auth/login`; sets **`cm_session`** HTTP-only cookie  
- **`/register`** — New account `POST /api/auth/register`; same cookie flow  

Protected (middleware requires valid cookie):

- **`/`** — Dashboard (counts for all entities)  
- **`/dashboard`** — Server redirect to **`/`** (alias for assignment wording)  
- **`/courses`**, **`/instructors`**, **`/instructor-profiles`**, **`/students`**, **`/enrollments`** — One **dedicated route per backend model**, each with tables + Create form + Edit modal/dialog + Delete  

Sidebar uses **`next/link`** for client-side navigation (`AppShell.tsx`).

---

## Authentication Architecture

1. **Login / register** call Route Handlers under `src/app/api/auth/` which sign a JWT (jose + `JWT_KEY`) and attach it via **`Set-Cookie`** (`httpOnly`, `sameSite=lax`, `secure` in production). No long-lived JWT in `localStorage` anymore.  
2. **Axios** is configured with **`withCredentials: true`** so the browser attaches the cookie on same-origin `/api/*` requests.  
3. **`src/middleware.ts`** runs on **page routes only** (`matcher` **excludes** `/api`). Unauthenticated visits are redirected to `/login?next=…`. Authenticated visits to `/login` or `/register` redirect **home**.  
4. **`AuthContext`** (`src/context/AuthContext.tsx`): on mount calls **`GET /api/auth/me`** with Axios to hydrate `{ email, role }`. After login/register, response body includes `user` so you don’t flash “logged out” before `/me`. **`POST /api/auth/logout`** clears the cookie server-side.

API routes accept either **Bearer token** header **or** the session cookie (`extractAuthToken` in `src/lib/auth-jwt.ts`) — useful if you demo with Swagger or curl.

---

## Backend / CRUD Coverage (aligned with Prisma schema)

REST handlers live in `src/app/api/`.

| Domain model | Routes | Frontend page |
|--------------|--------|----------------|
| **User** (auth) | `/api/auth/*` (`login`, `register`, `logout`, `me`) | Login + Register |
| **Instructor** | `GET`/`POST` `/api/instructors`, `GET`/`PATCH`/`DELETE` `/api/instructors/[id]` | `/instructors` |
| **InstructorProfile** | `GET`/`POST` `/api/instructor-profiles`, `GET`/`PATCH`/`DELETE` `/api/instructor-profiles/[id]` | `/instructor-profiles` |
| **Course** | `GET`/`POST` `/api/courses`, `GET`/`PATCH`/`DELETE` `/api/courses/[id]` | `/courses` |
| **Student** | `GET`/`POST` `/api/students`, `GET`/`PATCH`/`DELETE` `/api/students/[id]` | `/students` |
| **Enrollment** | `GET`/`POST` `/api/enrollments`, `GET`/`PATCH`/`DELETE` `/api/enrollments/[id]` | `/enrollments` |

**Note:** Mutation APIs no longer gate on `"Admin"` only; any **authenticated** user can mutate (students registered via `/register` get role `Student` but still demo full CRUD for the assignment).

---

## Database changes you must mention

A **`Users`** table was added (`prisma/schema.prisma` + migration `prisma/migrations/20260502120000_add_users/migration.sql`) for persisted registration:

- Run migrations against MySQL (`DATABASE_URL`): e.g. `npx prisma migrate deploy`  
- Seed creates **`admin@uni.com` / `password123`** via bcrypt (`prisma/seed.ts`)

If the **`Users`** table doesn’t exist yet, registration will fail until migration is applied.

---

## Environment

- **`JWT_KEY`** — required for signing tokens (middleware + APIs). Already expected by the codebase.  

---

## Legacy .NET note

There is still a legacy **ASP.NET CourseManagementAPI** in the repo root; **`web`** is self-contained Next.js **BFF** pattern (pages + `/api` + Prisma + MySQL). If the assignment insists on wiring the browser to **only** another port, mirror the cookie contract or point Axios `baseURL` at that server and replicate `withCredentials`; the current tutor demo is intentionally **same-app** for cohesion.

---

## Files worth opening in review

| Area | Path |
|------|------|
| Middleware | `web/src/middleware.ts` |
| Axios | `web/src/lib/axios-instance.ts` |
| Session cookie helpers | `web/src/lib/session-cookie.ts` |
| Auth state | `web/src/context/AuthContext.tsx` |
| Protected shell | `web/src/components/AuthedLayout.tsx` |

---

_Generated as a discussion aid for grading / walk-through with your tutor._
