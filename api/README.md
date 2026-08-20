# API — Laravel Backend

Laravel 13 on PHP 8.3+ with JWT authentication.

## Quick Commands

```bash
composer setup        # Full setup: install deps, key, migrate, seed, build assets
composer dev          # Start dev server (Laravel + Vite HMR on port 8000)
php artisan test --compact    # Run tests (SQLite in-memory)
vendor/bin/pint --dirty --format agent   # Format PHP after changes
```

## Directory Structure

```
api/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/   # 7 controllers + 5 API resources
│   │   └── Requests/          # Form request validation
│   ├── Models/                # 8 Eloquent models
│   └── Services/              # TestGenerationService, MarkingService, ImageService
├── database/
│   ├── migrations/            # 11 migrations
│   ├── seeders/               # User + Category seeders
│   └── factories/             # Model factories for tests
├── routes/api.php             # All API routes
└── tests/                     # Pest PHP tests
```

## Key Conventions

- PHP 8 attributes on models: `#[Fillable([...])]`, `#[Hidden([...])]`
- Pest PHP for testing (not PHPUnit directly)
- Laravel Pint for formatting (run `vendor/bin/pint --dirty --format agent`)
- JWT auth via `tymon/jwt-auth`
- Form Requests for validation
- API Resources for JSON responses
- Pass `--no-interaction` to all `php artisan make:` commands

## Default Admin

- Email: `admin@test.com`
- Password: `password`

## Full Documentation

- [API Reference](../docs/api.md) — all endpoints with examples
- [Architecture](../docs/architecture.md) — database schema, services, design decisions
- [Development Setup](../docs/setup.md) — prerequisites, env config, troubleshooting
