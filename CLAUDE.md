# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Tutor School System (ระบบจัดการโรงเรียนกวดวิชา) — a full-stack management system for a tutoring school covering students, tutors, courses, enrollment/payment, online exams, schedules, attendance, and notifications.

- `backend/` — Java 21 + Spring Boot 3.5 REST API
- `frontend/` — React 19 + Vite SPA

## Commands

### Backend (run from `backend/`)

```bash
# Run dev server (Windows)
.\mvnw spring-boot:run

# Build (skip tests)
.\mvnw clean package -DskipTests

# Run all tests
.\mvnw test

# Run a single test class
.\mvnw test -Dtest=ClassName
```

Requires PostgreSQL 14+ running locally with a `tutorschool_db` database created (`CREATE DATABASE tutorschool_db;`). `spring.jpa.hibernate.ddl-auto=update` auto-creates/updates tables on startup — no manual schema migration needed in dev.

Config lives in `backend/src/main/resources/application.properties`, overridable via env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`.

Server runs on `http://localhost:8080`. Swagger UI at `/swagger-ui/index.html`, OpenAPI spec at `/v3/api-docs`.

Test accounts (after running seed data — see `backend/SEED_DATA_GUIDE.md`): `admin@school.com` / `tutor@school.com` / `student@school.com`, passwords `{role}123`.

### Frontend (run from `frontend/`)

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

There is no automated frontend test suite currently. Frontend `axios` client is hardcoded to `http://localhost:8080/api/v1` (`frontend/src/shared/services/api.js`) — the backend must be running for the frontend to function.

Via Claude Code's dev-server tooling, the frontend is registered as `.claude/launch.json` config `"frontend"` (`npm --prefix frontend run dev`, port 5173). There is no backend entry in `launch.json`; start the backend manually with `mvnw`.

## Architecture

### Backend layering (`backend/src/main/java/com/tutorschool/backend/`)

Standard layered Spring Boot architecture — always follow the existing layer when adding a feature:

```
controller/   REST controllers (one per resource, ~19 total)
service/      business logic interfaces, service/impl/ for implementations
repository/   Spring Data JPA interfaces
entity/       JPA entities + enums (Role, *Status, *Type enums live here)
dto/request/  request DTOs
dto/response/ response DTOs — ApiResponse<T> wrapper, PageResponse<T> for pagination
mapper/       manual entity <-> DTO mapper classes (no MapStruct)
exception/    GlobalExceptionHandler + custom exception types (no stack traces sent to client)
security/     JwtService, JwtAuthenticationFilter, CustomUserDetailsService
config/       SecurityConfig (JWT filter chain, CORS, @PreAuthorize roles), OpenApiConfig, WebConfig
scheduler/    @Scheduled jobs (ExamScheduler, PaymentDeadlineScheduler)
seeder/       startup data seeders (AdminSeeder, InstitutionProfileSeeder, TutorCodeBackfillSeeder)
util/         misc helpers (e.g. ScheduleDaysParser)
```

**Role enum is `Role.TUTOR`, not `TEACHER`** — table `tutors`, endpoint `/api/v1/tutors`, `@PreAuthorize("hasRole('TUTOR')")`. This was renamed from `TEACHER` early in the project; don't reintroduce the old name. Three roles total: `ADMIN`, `TUTOR`, `STUDENT`.

Every controller endpoint returns `ApiResponse<T>`:
```json
{ "success": true, "message": "...", "data": {...}, "errors": null, "timestamp": "..." }
```
Validation failures populate `errors` as a `{fieldName: message}` map. Frontend code must check `success` before reading `data`.

Auth is JWT bearer (`Authorization: Bearer {token}`), access token expires in 15 min, refresh token in 7 days (`jwt.access-token-expiration` / `jwt.refresh-token-expiration` in `application.properties`).

CORS is restricted to `http://localhost:5173` and `http://localhost:3000` in `SecurityConfig.java` — add real domains there before deploying.

DB naming convention: snake_case plural table names, snake_case columns, `id` BIGSERIAL PK, `{table_singular}_id` FK, every table has `created_at`/`updated_at`, money columns are `NUMERIC(10,2)`.

### Frontend structure (`frontend/src/`)

Role-based feature folders, not a flat pages/components split:

```
auth/            login/register pages + auth services
routes/          AppRoutes.jsx (top-level router), ProtectedRoute.jsx (auth+role guard),
                 adminRoutes.jsx / tutorRoutes.jsx / studentRoutes.jsx (per-role route trees)
roles/admin/     admin-only pages, components, layouts, services
roles/tutor/     tutor-only pages, components, layouts, services
roles/student/   student-only pages, components, layouts, services
shared/services/ api.js (axios instance + interceptors), institutionService.js
shared/hooks/    cross-role hooks (e.g. useInstitutionProfile)
shared/utils/    tokenUtils.js (localStorage token/role read helpers)
```

`ProtectedRoute` gates routes on both auth token presence and `allowedRoles` membership — new pages under `roles/{role}/` should be wired into the matching `*Routes.jsx` and wrapped in `ProtectedRoute` with the correct `allowedRoles`.

`shared/services/api.js` holds a single axios instance with:
- request interceptor that attaches the bearer token from `localStorage`
- response interceptor that, on 401/403, attempts a silent token refresh (queuing concurrent failed requests while refreshing) and otherwise force-logs-out and redirects to `/login`

New API calls should go through this shared `api` instance (or a per-role `services/` wrapper around it), not raw `axios`, so refresh/logout behavior stays consistent.

## Reference docs

The `backend/` directory has several long-form docs worth consulting before large changes:
- `README_BACKEND.md` — full setup, env vars, module list, production checklist
- `FRONTEND_API_GUIDE.md` — API contract reference for frontend integration
- `SEED_DATA_GUIDE.md` — how to seed test accounts/data
- `BACKEND_HANDOFF_CHECKLIST.md` — audit/handoff checklist

`frontend/STUDENT_API_HANDOFF.md` documents the student-facing API surface.

`generate_data_dictionary.py` / `run_dictionary.bat` (repo root) generate a data dictionary — likely from the live DB schema or entity sources.
