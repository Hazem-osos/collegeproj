# # Course Management System API

A RESTful API built with ASP.NET Core and Entity Framework Core for managing courses, instructors, and students.

---

## How to Run

### Prerequisites
- .NET 10 SDK
- A terminal

### Steps

1. Clone or extract the project folder
2. Navigate into the project directory:
```
   cd CourseManagementAPI
```
3. Restore dependencies:
```
   dotnet restore
```
4. Apply database migrations:
```
   dotnet ef database update
```
5. Run the API:
```
   dotnet run
```
6. The API will be available at:
```
   http://localhost:5007
```

---

## Technologies Used

| Technology | Description |
|---|---|
| ASP.NET Core 10 | Web framework for building the REST API |
| Entity Framework Core 10 | ORM used to interact with the database using C# models instead of raw SQL |
| SQLite | Lightweight file-based database, ideal for development and assignment purposes |
| JWT (JSON Web Tokens) | Used for stateless authentication — the server issues a signed token the client sends with every request |
| Microsoft.AspNetCore.Authentication.JwtBearer | Middleware that validates incoming JWT tokens on protected endpoints |
| Swagger / OpenAPI | Auto-generates API documentation from the code |

---

## Entity Relationships

- **One-to-One**: `Instructor` → `InstructorProfile` (each instructor has one profile)
- **One-to-Many**: `Instructor` → `Course` (one instructor teaches many courses)
- **Many-to-Many**: `Student` ↔ `Course` via the `Enrollment` join entity

---

## Authentication

The API uses JWT authentication. To access protected endpoints:

1. Send a POST request to `/api/Auth/login` with valid credentials
2. Copy the token from the response
3. Include it in the `Authorization` header of subsequent requests:
```
   Authorization: Bearer <your_token>
```

### Test credentials
- Email: `admin@uni.com`
- Password: `password123`
- Role: `Admin`

---

## Authorization

Endpoints are protected using the `[Authorize]` attribute. Role-based access control is implemented:

- `GET` endpoints — any authenticated user
- `POST` and `DELETE` endpoints — `Admin` role only

---

## Why HTTP-Only Cookies Are the Industry Standard for Authentication Security

When building authentication systems, storing JWT tokens in `localStorage` or `sessionStorage` is a common but insecure approach. Any JavaScript running on the page — including malicious scripts injected via XSS (Cross-Site Scripting) attacks — can read from these storage mechanisms and steal the token.

HTTP-only cookies solve this problem. A cookie marked as `HttpOnly` is completely inaccessible to JavaScript. The browser automatically attaches it to every request, but no script can ever read or modify it. This means even if an attacker successfully injects malicious JavaScript into the page, they cannot steal the authentication token because it is invisible to the JavaScript runtime.

Combined with the `Secure` flag (which ensures the cookie is only sent over HTTPS) and `SameSite=Strict` (which prevents the cookie from being sent in cross-site requests), HTTP-only cookies provide a significantly stronger security posture than token storage in the browser's JavaScript-accessible storage.

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/Auth/login | Login and receive a JWT token | No |

### Courses
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/Courses | Get all courses | Yes |
| GET | /api/Courses/{id} | Get course by ID | Yes |
| POST | /api/Courses | Create a new course | Admin only |
| DELETE | /api/Courses/{id} | Delete a course | Admin only |

### Instructors
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/Instructors | Get all instructors | Yes |
| GET | /api/Instructors/{id} | Get instructor by ID | Yes |
| POST | /api/Instructors | Create a new instructor | Admin only |
| DELETE | /api/Instructors/{id} | Delete an instructor | Admin only |

### Students
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/Students | Get all students | Yes |
| GET | /api/Students/{id} | Get student by ID | Yes |
| POST | /api/Students | Create a new student | Admin only |
| DELETE | /api/Students/{id} | Delete a student | Admin only |
