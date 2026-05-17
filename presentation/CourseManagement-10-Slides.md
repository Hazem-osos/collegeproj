# Course Management Platform — 10-slide talk

Copy each **Slide** block into PowerPoint, Google Slides, or Keynote (one slide per section). Speaker notes are optional talking points.

---

## Slide 1 — Title

**Course Management System**  
A full-stack platform for administrators, instructors, and students

- College / course administration demo project  
- Modern web UI with secure sign-in and role-based access  

**Speaker notes:** Introduce yourself and the project scope: managing courses, people, and enrollments in one place.

---

## Slide 2 — What problem does it solve?

**Centralize academic operations**

- One place to maintain **courses**, **instructors**, **students**, and **enrollments**  
- Clear separation: who can **manage** vs **teach** vs **learn**  
- Reduces scattered spreadsheets and ad hoc email workflows  

**Speaker notes:** Frame the “before” (fragmented data) vs “after” (single system of record).

---

## Slide 3 — High-level architecture

**Monorepo: web app + optional API**

- **Next.js 15** (`web/`): UI, same-origin **REST `/api/*`**, Prisma → **MySQL**  
- **ASP.NET Core** (repo root): optional REST API, same database schema concepts  
- UI can use Next-only mode or point **login/admin** at .NET via `NEXT_PUBLIC_DOTNET_API_URL`  

**Speaker notes:** Emphasize Prisma owns the schema; .NET stays aligned for teams that prefer C# services.

---

## Slide 4 — Technology stack

**What we built with**

| Layer        | Choices                                      |
|-------------|-----------------------------------------------|
| Frontend    | React 19, Next.js App Router, Tailwind       |
| Backend (web)| Route handlers, Prisma 5, jose + bcrypt    |
| Database    | MySQL 8                                      |
| Optional API| ASP.NET Core, EF Core, Pomelo MySQL          |
| Auth        | JWT in HTTP-only cookie (`cm_session`), Bearer to .NET when enabled |

**Speaker notes:** Keep this slide skimmable; dive deeper only if the audience is technical.

---

## Slide 5 — Roles: Admin

**Administrators**

- Dashboard and CRUD for **courses**, **instructors**, **students**, **enrollments**  
- Create **instructor accounts** and link roster data  
- Control **enrollment** records (including status workflow where applicable)  

**Speaker notes:** Admin is the “source of truth” for institutional data entry.

---

## Slide 6 — Roles: Instructor

**Instructors**

- **Teaching** area: dashboard, **my courses**, **roster / enrollments**, **profile**  
- APIs under `/api/teaching/*` back the instructor experience  
- Tied to `User` via **InstructorId** for login and permissions  

**Speaker notes:** Instructors see only what they teach; middleware and APIs enforce that boundary.

---

## Slide 7 — Roles: Student

**Students**

- **Register** → linked to a **Student** roster row  
- **Browse courses** to discover offerings; **My courses** for current enrollments  
- **Settings** for profile and account maintenance  
- Enrollment can move through states (e.g. **pending → approved / rejected**)  

**Speaker notes:** Students never get admin URLs; middleware blocks management routes.

---

## Slide 8 — Data model (core entities)

**Relational core**

- **User** — login; optional links to **Student** and **Instructor**  
- **Instructor** + **InstructorProfile** (bio, office)  
- **Course** — title, credits, assigned instructor  
- **Enrollment** — student ↔ course, **status**, optional **grade**, timestamps  

**Speaker notes:** One sentence: “Everything hangs off users, courses, and the enrollments that connect them.”

---

## Slide 9 — Security & auth

**How access is protected**

- Passwords stored as **hashes** (bcrypt)  
- **JWT** signed with a strong shared secret; issued on login/register  
- **HTTP-only cookie** for browser sessions; optional **Bearer** token path to ASP.NET  
- **Middleware** enforces role-based routes and API guards  

**Speaker notes:** Mention never committing `.env` / `JWT_KEY` and keeping dev vs prod secrets separate.

---

## Slide 10 — Demo flow & wrap-up

**Suggested live demo (2–3 minutes)**

1. Log in as **admin** — show course/instructor/student management  
2. Log in as **instructor** — open a course roster / pending enrollments  
3. Log in as **student** — browse courses and show **My courses**  

**Closing**

- Repo: **Course Management** monorepo (Next + optional .NET + MySQL)  
- **Thank you / Q&A**

**Speaker notes:** If no live demo, use screenshots of the three role dashboards instead.
