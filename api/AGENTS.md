# Backend AGENTS.md — Laravel API

## Foundational Context

Laravel 13 on PHP 8.4. Always use APIs matching the installed major version — confirm with `composer show --direct` before relying on a package's API.

## Code Conventions

- Follow existing code conventions in sibling files — check structure, approach, naming before creating new files.
- Use descriptive names: `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components/services to reuse before writing new ones.
- Stick to existing directory structure; don't create new base folders without approval.

## PHP Rules

- Always use curly braces for control structures, even single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`.
- Use explicit return type declarations and type hints on all methods.
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only inline for exceptionally complex logic.

## Laravel Rules

- Use `php artisan make:` to create files (migrations, controllers, models, classes). Pass `--no-interaction`.
- When creating models, also create factories and seeders: `php artisan make:model --help` for options.
- Default to Eloquent API Resources for APIs.
- Prefer named routes and `route()` for URL generation.
- Read config via `php artisan config:show app.name` or directly from `config/`.

## Testing

- Uses **Pest PHP**. Create tests: `php artisan make:test --pest {Name}` (omit directory prefix).
- Run: `php artisan test --compact` or `--filter=testName`.
- Use factories for models in tests. Check for custom factory states first.
- Faker: follow existing convention (`$this->faker` vs `fake()`).
- Tests use SQLite in-memory (phpunit.xml overrides .env DB config).

## Formatting

- After modifying PHP files, always run: `vendor/bin/pint --dirty --format agent`

## Frontend Assets (Blade)

- Admin Blade assets are built from `api/` via Vite with Tailwind CSS v4.
- If changes don't appear in UI, the user may need `npm run build` or `composer run dev`.

## Laravel Boost MCP Tools

Available tools for this project:
- `database-query` — read-only DB queries (prefer over tinker raw SQL)
- `database-schema` — inspect table structure before writing migrations/models
- `get-absolute-url` — resolve scheme/domain/port for URLs
- `browser-logs` — read recent browser logs/errors
- `search-docs` — search Laravel ecosystem docs before changes depending on package APIs

### search-docs usage
- Pass `packages` array to scope results. Use broad topic queries: `['rate limiting', 'routing']`.
- Words = auto-stemmed AND. `"quoted phrases"` = exact position. Multiple queries = OR logic.
