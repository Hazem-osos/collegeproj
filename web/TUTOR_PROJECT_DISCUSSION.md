# Web Engineering Project — Discussion Notes for Your Tutor

Summary of the Next.js app (`web/`), roles, routing, and how to run it with MySQL.

---

## Stack (assignment alignment)

| Requirement | Implementation |
|-------------|----------------|
| Next.js App Router | `src/app/` — route groups **`(main)`** (admin shell), **`(student)`** (student home), **`settings/`** (shared URL, role-based shell) |
| React + `"use client"` | Interactive pages: forms, Axios, hooks, modals |
| **Axios** | `src/lib/axios-instance.ts` — **`withCredentials: true`**, cookie session |
| `useState` / `useEffect` | Tables, auth bootstrap, dialogs |

---

## Routing

**Public**

- **`/login`**, **`/register`** — `POST /api/auth/login` / `register`; **HTTP-only** cookie **`cm_session`**

**Admin only** (middleware sends students away to **`/my-courses`**)

- **`/`** — Dashboard counts  
- **`/dashboard`** → redirect **`/`**  
- **`/courses`**, **`/instructors`**, **`/instructor-profiles`**, **`/students`**, **`/enrollments`** — full CRUD UI  
- **`/settings`** — password (App shell)

**Student only**

- **`/my-courses`** — enrolled courses + **instructor (professor) name**  
- **`/settings`** — password + **display name** (`PATCH /api/me/profile`)

**`next/link`** in **`AppShell`** / **`StudentShell`**.

---

## Authentication

1. JWT in **`cm_session`** (jose, **`JWT_KEY`**).  
2. **`src/middleware.ts`** — validates cookie on pages; redirects by **role** (students cannot open admin URLs).  
3. **`AuthContext`** — **`GET /api/auth/me`** hydrates **`{ email, role, studentId?, fullName? }`**.  
4. **`POST /api/auth/logout`** clears cookie.  
5. APIs accept **cookie or** `Authorization: Bearer` (`extractAuthToken`).

---

## Roles & data model

- **`Users`** — login; **`Role`**: `Admin` | `Student`; optional **`StudentId`** (FK → **`Students`**, unique).  
- **Registration** — creates **`Student`** + **`User`** with **`StudentId`** set.  
- **Admin** seed: **`admin@uni.com`** / **`password123`**, **`StudentId`** null.  
- **Enrollment** — only **admins** use **`/api/enrollments`**; students read **`GET /api/me/enrollments`**.

Management routes use **`requireAdminDb`** (DB role, with JWT fallback for rare token-only bootstrap). Student-scoped APIs use **`requireStudentScoped`**.

---

## Notable API routes

| Area | Routes |
|------|--------|
| Auth | `login`, `register`, `logout`, `me`, **`password`** |
| Student self | **`GET /api/me/enrollments`**, **`PATCH /api/me/profile`** |
| Admin CRUD | `courses`, `instructors`, `students`, `enrollments`, `instructor-profiles` (+ `[id]` PATCH/DELETE where applicable) |

---

## Database

Apply schema to MySQL (`DATABASE_URL`):

- **`npm run db:deploy`** or **`npm run db:push`**  
- If Prisma warns on **`Users.StudentId`** unique index: **`npx prisma db push --accept-data-loss`** is often used in dev when only adding nullable FKs.  

Migrations folder includes:

- **`20260422120000_init`** — core LMS tables  
- **`20260502120000_add_users`** — **`Users`**  
- **`20260502183000_users_link_student`** — **`Users.StudentId`** → **`Students`**

**`npm run db:seed`** — admin user + sample instructor/course.

---

## Files to review

| Topic | Path |
|------|------|
| Middleware + role redirects | `web/src/middleware.ts` |
| Role helpers | `web/src/lib/auth-redirects.ts`, `web/src/lib/api-helpers.ts` |
| JWT claims | `web/src/lib/auth-jwt.ts` |
| Axios | `web/src/lib/axios-instance.ts` |
| Auth UI state | `web/src/context/AuthContext.tsx` |
| Admin shell | `web/src/components/AuthedLayout.tsx`, `AppShell.tsx` |
| Student shell | `web/src/components/StudentAuthedLayout.tsx`, `StudentShell.tsx` |

---

_Living document for grading / demo with your tutor._
