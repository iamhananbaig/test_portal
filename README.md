# Test Portal

Hiring assessment portal for admin-managed candidate testing. Administrators create question banks, generate randomized timed tests, and review results. Candidates enter a Test ID to take a timed assessment with auto-save and auto-submit.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3+, MySQL 8 |
| Frontend | React 19, TypeScript 6, Vite 8 |
| Styling | Tailwind CSS v4 |
| Auth | JWT (`tymon/jwt-auth`) |
| Icons | lucide-react |
| Testing | Pest PHP 5 (backend), oxlint (frontend) |

## Quick Start

```bash
# 1. Setup backend (installs deps, generates key, runs migrations, seeds, builds assets)
cd api
composer setup

# 2. Start backend (Laravel + Vite HMR)
composer dev

# 3. In a separate terminal — start frontend (React SPA)
cd frontend
npm install
npm run dev
```

**Default admin login:** `admin@test.com` / `password`

## Architecture

```
test_portal/
├── api/            # Laravel backend (API + Blade admin assets)
├── frontend/       # React SPA (admin UI + candidate portal)
└── docs/           # Documentation
```

- **Admin UI** — React SPA at `/admin/*` (JWT-protected)
- **Candidate Portal** — React SPA at `/candidate/*` (public, test_id-based)
- **API** — Laravel at `/api/*` (JWT auth for admin, public for candidate routes)
- Frontend Vite dev server proxies `/api` to `http://127.0.0.1:8000`

## Documentation

- [Development Setup](docs/setup.md) — prerequisites, env config, dev servers, troubleshooting
- [Architecture](docs/architecture.md) — database schema, services, routing, design decisions
- [API Reference](docs/api.md) — all endpoints with request/response examples

## Development Commands

| Command | Description |
|---|---|
| `cd api && composer setup` | Full backend setup |
| `cd api && composer dev` | Start backend dev server |
| `cd frontend && npm run dev` | Start frontend dev server |
| `cd api && php artisan test --compact` | Run backend tests |
| `cd frontend && npm run lint` | Lint frontend |
| `cd api && vendor/bin/pint --dirty --format agent` | Format backend PHP |

## Project Specs

- [Product Requirements](project.md) — full product specification
- [Product Overview](PRODUCT.md) — concise product summary
- [Technical Plan](plan.md) — implementation plan with milestones
