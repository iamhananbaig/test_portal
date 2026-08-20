# AGENTS.md

## Project Overview

Candidate Online Testing Portal — a hiring assessment platform with admin management and a candidate test-taking SPA. Currently in **early scaffolding** (fresh Laravel + React boilerplate). Full specs in `project.md` (product requirements) and `plan.md` (technical implementation plan).

**Note:** `plan.md` references `backend/` but the actual directory is `api/`.

## Monorepo Structure

| Directory | Purpose | Tech |
|---|---|---|
| `api/` | Laravel backend + Blade admin assets | Laravel 13, PHP 8.4, MySQL, JWT auth, Tailwind v4 |
| `frontend/` | React SPA (candidate portal + admin UI) | React 19, TypeScript 6, Vite 8, oxlint |
| `.agents/skills/` | AI agent skills (inferred from project) | Laravel best practices, Pest testing, Tailwind, conventions |

Two separate `package.json` files:
- `api/package.json` — Vite build for Blade-served admin assets (Tailwind CSS)
- `frontend/package.json` — Standalone React SPA (oxlint, TypeScript)

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

Tests use **SQLite in-memory** (configured in `api/phpunit.xml`), not MySQL.

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

- **PHP 8 attributes** on models: `#[Fillable]`, `#[Hidden]` — not traditional `$fillable` arrays
- **Pest PHP** for testing, not PHPUnit directly
- **Pint** for PHP formatting — always run `vendor/bin/pint --dirty --format agent` before finalizing PHP changes
- **oxlint** for frontend linting (not ESLint)
- **JWT auth** via `tymon/jwt-auth` — not Sanctum for API auth
- Pass `--no-interaction` to all `php artisan make:` commands
- Create factories + seeders alongside models

## Database

- Dev: MySQL 8 on `127.0.0.1:3306` (configured in `api/.env`)
- Tests: SQLite in-memory (overridden in `api/phpunit.xml`)
- Planned tables (from `plan.md`): users, categories, questions, question_options, tests, test_questions, candidate_answers, results

## Skills

Domain-specific skills in `.agents/skills/` and `api/.agents/skills/`:
- `laravel-best-practices` — Laravel architecture, queries, auth, validation
- `pest-testing` — Pest PHP test creation and patterns
- `tailwindcss-development` — Tailwind CSS v4
- `infer-conventions` — Detect and document project conventions

Activate the relevant skill when working in that domain.

## API Routes (Planned, from `plan.md`)

27 endpoints across 6 groups: Auth, Categories, Questions, Tests, Marking, Results, plus public Candidate Portal routes. All defined in `plan.md:179-242`.
