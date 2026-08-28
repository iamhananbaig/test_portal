# AGENTS.md

## Project Overview

Candidate Online Testing Portal — a hiring assessment platform with admin management and a candidate test-taking SPA. Full specs in `project.md` (product requirements) and `plan.md` (technical implementation plan).

**Note:** `plan.md` references `backend/` but the actual directory is `api/`.

## Monorepo Structure

| Directory | Purpose | Tech |
|---|---|---|
| `api/` | Laravel backend + Blade admin assets | Laravel 13, PHP 8.4, MySQL, JWT auth, Tailwind v4 |
| `frontend/` | React SPA (candidate portal + admin UI) | React 19, TypeScript 6, Vite 8, oxlint |

Two separate `package.json` files:
- `api/package.json` — Vite build for Blade-served admin assets (Tailwind CSS)
- `frontend/package.json` — Standalone React SPA (oxlint, TypeScript)

Backend-specific conventions live in `api/AGENTS.md`. Refer to it when writing PHP/Laravel code.

## Commands

### Full Setup (backend)

```bash
cd api && composer setup
```
Runs: `composer install` → `.env` copy → `key:generate` → `migrate --force` → `npm install --ignore-scripts` → `npm run build`

### Dev Servers

```bash
# Backend (Laravel + Vite HMR)
cd api && composer dev

# Frontend (React SPA)
cd frontend && npm run dev
```

### Tests (backend only)

```bash
cd api && php artisan test --compact                          # all tests
cd api && php artisan test --compact --filter=testName        # single test
cd api && composer test                                        # clear config + run tests
```

Tests use **SQLite in-memory** (configured in `api/phpunit.xml`), not MySQL. All Feature tests use `RefreshDatabase` via Pest config.

### Lint & Format

```bash
# Frontend lint
cd frontend && npm run lint

# Backend format (run after modifying PHP files)
cd api && vendor/bin/pint --dirty --format agent
```

### Frontend Build

```bash
cd frontend && npm run build    # tsc -b && vite build
cd api && npm run build         # vite build (Blade assets)
```

## Key Conventions

- **PHP 8 attributes** on models: `#[Fillable([...])]`, `#[Hidden([...])]` — not traditional `$fillable` arrays
- **Pest PHP** for testing, not PHPUnit directly. Tests use `beforeEach` for auth setup with `auth('api')->login()`.
- **Pint** for PHP formatting — always run `vendor/bin/pint --dirty --format agent` before finalizing PHP changes
- **oxlint** for frontend linting (not ESLint). Config at `frontend/.oxlintrc.json`.
- **JWT auth** via `tymon/jwt-auth` — not Sanctum for API auth
- Pass `--no-interaction` to all `php artisan make:` commands
- Create factories + seeders alongside models
- **Form Requests** for validation (e.g. `StoreCategoryRequest`, `StoreQuestionRequest`)
- **API Resources** for JSON responses (e.g. `CategoryResource`, `QuestionResource`)

## Frontend Conventions

- **Tailwind v4** with custom theme tokens in `frontend/src/index.css` — uses `@theme` directive, not `tailwind.config.js`
- Custom color palette: `primary-*` (blue), `slate-*` (neutrals), semantic `emerald-*`, `amber-*`, `rose-*`, `violet-*`
- Font: **Plus Jakarta Sans** (defined in `index.css`), not Inter
- Reusable UI components in `frontend/src/components/ui/` (Button, Input, Card, Table, Modal, etc.)
- **lucide-react** for icons (not heroicons or fontawesome)
- **axios** for API calls with JWT interceptor in `frontend/src/services/api.ts`
  - `default export api` — admin API client (attaches Bearer token, redirects to `/admin/login` on 401)
  - `candidateApi` — public candidate API client (no auth headers)
- **react-router v8** for routing. Admin routes under `/admin`, candidate routes under `/candidate`.
- Auth context at `frontend/src/context/AuthContext.tsx` — stores token + user in localStorage
- Vite dev server proxies `/api` and `/storage` to `http://127.0.0.1:8000` (backend)
- Pages export default functions, no barrel exports
- **react-hook-form** with **zod** schemas for form validation (see `frontend/src/lib/validations.ts`)
- **@tanstack/react-query** for server state management and caching

## Database

- Dev: MySQL 8 on `127.0.0.1:3306` (configured in `api/.env`)
- Tests: SQLite in-memory (overridden in `api/phpunit.xml`)
- Tables: users, categories, questions, question_options, tests, test_questions, candidate_answers, results, candidates, test_profiles, test_profile_categories

## Skills

Domain-specific skills available:
- **Root** (`.agents/skills/`): `frontend-design`, `agent-browser`

Activate the relevant skill when working in that domain.

## Laravel Boost MCP

The `laravel-boost` MCP server is configured for this project (runs `php artisan boost:mcp` from `api/`). Available tools:
- `database-query` — read-only DB queries
- `database-schema` — inspect table structure
- `search-docs` — search Laravel ecosystem docs (pass `packages` array to scope)
- `browser-logs` — read browser console logs
- `get-absolute-url` — resolve URLs

## API Routes (from `plan.md`)

45+ endpoints across 8 groups: Auth, Categories, Questions (including bulk upload), Test Profiles, Tests, Candidates, Marking, Results, plus public Candidate Portal routes. All defined in `api/routes/api.php`.
