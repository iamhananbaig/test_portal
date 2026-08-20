# Architecture

## Monorepo Structure

```
test_portal/
├── api/                    # Laravel 13 backend + Blade admin assets
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # 7 controllers + 5 API resources
│   │   │   └── Requests/          # Form request validation
│   │   ├── Models/                # 8 Eloquent models
│   │   └── Services/              # Business logic (3 services)
│   ├── database/
│   │   ├── migrations/            # 11 migrations
│   │   ├── seeders/               # User + Category seeders
│   │   └── factories/             # Model factories for tests
│   ├── routes/api.php             # All API routes
│   └── tests/                     # Pest PHP tests (Feature + Unit)
├── frontend/               # React 19 SPA (candidate portal + admin UI)
│   └── src/
│       ├── pages/admin/            # 11 admin pages
│       ├── pages/candidate/        # 4 candidate pages
│       ├── components/ui/          # 15 reusable UI components
│       ├── context/                # Auth + Theme providers
│       ├── services/               # Axios API client
│       └── hooks/                  # Custom React hooks
└── docs/                   # Project documentation
```

Two separate `package.json` files:
- `api/package.json` — Vite build for Blade-served admin assets (Tailwind CSS)
- `frontend/package.json` — Standalone React SPA

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3+ |
| Frontend | React 19, TypeScript 6, Vite 8 |
| Styling | Tailwind CSS v4 (custom `@theme` tokens) |
| Database | MySQL 8 (dev/prod), SQLite in-memory (tests) |
| Auth | JWT via `tymon/jwt-auth` |
| Icons | lucide-react |
| Forms | react-hook-form + zod validation |
| Data fetching | @tanstack/react-query + axios |
| Linting | oxlint (frontend), Laravel Pint (backend) |
| Testing | Pest PHP 5 (backend) |

## Database Schema

### Entity Relationship

```
users ─────────────────────────────────────────────────┐
                                                        │
categories ──┬── questions ──┬── question_options       │
             │               │                          │
             └── test_questions ── tests ── results ────┘
                                    │
                                    └── candidate_answers
```

### Tables

#### `users` (admin)

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(255) | |
| email | varchar(255) unique | |
| password | varchar(255) | hashed |

#### `categories`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(255) | |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

Default seed: IQ, Accounting, Tax

#### `questions`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| category_id | FK → categories | |
| type | enum(`mcq`, `descriptive`) | |
| text | text | question body |
| image_path | varchar (nullable) | local file path |
| marks | decimal(5,2) | > 0 |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

#### `question_options`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| question_id | FK → questions | |
| label | char(1) | A, B, C, D |
| text | text | option text |
| image_path | varchar (nullable) | |
| is_correct | boolean | only for MCQ |

#### `tests`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | varchar(8) unique | e.g. `A8KM-P2Q7` |
| candidate_name | varchar(255) | |
| candidate_cnic | varchar(15) | |
| duration_minutes | integer | |
| total_marks | decimal(7,2) | calculated from selected questions |
| status | enum | see below |
| created_at | timestamp | |
| started_at | timestamp (nullable) | |
| expires_at | timestamp | created_at + 1 hour |
| ends_at | timestamp (nullable) | started_at + duration |
| submitted_at | timestamp (nullable) | |
| submission_method | enum(`manual`, `auto`, `admin`, nullable) | |

**Status flow:** `ready` → `in_progress` → `submitted` / `auto_submitted` / `pending_review` → `completed` | `expired`

#### `test_questions`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests | |
| question_id | FK → questions | |
| category_id | FK → categories | |
| display_order | integer | order within category |

#### `candidate_answers`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests | |
| question_id | FK → questions | |
| selected_option_id | FK → question_options (nullable) | for MCQ |
| descriptive_answer | text (nullable) | for descriptive |
| awarded_marks | decimal(5,2) (nullable) | set by admin during marking |
| updated_at | timestamp | for autosave tracking |

#### `results`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests unique | |
| mcq_marks | decimal(7,2) | auto-calculated |
| descriptive_marks | decimal(7,2) | admin-awarded |
| total_obtained | decimal(7,2) | mcq + descriptive |
| is_finalized | boolean | true when all marking done |
| created_at, updated_at | timestamp | |

## Service Layer

Three service classes in `api/app/Services/`:

### TestGenerationService

Handles test creation workflow:
1. Validates candidate details and category/question counts
2. Checks sufficient active questions per requested category
3. Randomly selects questions per category (`ORDER BY RAND()`)
4. Creates test + test_questions records
5. Generates unique 8-char test_id (format: `A8KM-P2Q7`, collision-checked)
6. Sets `expires_at` = now + 1 hour
7. Calculates total possible marks

### MarkingService

Handles marking and finalization:
1. Awards marks per descriptive question
2. Auto-calculates MCQ marks (compares selected_option vs is_correct)
3. Finalizes: sums mcq_marks + descriptive_marks, sets is_finalized

### ImageService

Handles question image uploads:
1. Validates file type (jpg, png) and size (max 5MB)
2. Stores to `storage/app/uploads/`
3. Returns relative path for DB storage

## Auth Architecture

- **JWT** via `tymon/jwt-auth` — not Sanctum
- Admin logs in via `POST /api/auth/login` → receives JWT token
- Frontend stores token in `localStorage`
- API requests include `Authorization: Bearer <token>` header
- 401 response → frontend clears token → redirects to `/admin/login`
- Candidate portal routes are public (no auth required, use test_id for identification)

## Frontend Routing

### Admin Routes (protected by `RequireAuth`)

| Path | Page |
|---|---|
| `/admin/login` | Login (guest only) |
| `/admin` | Dashboard |
| `/admin/categories` | Category management |
| `/admin/questions` | Question bank |
| `/admin/questions/new` | Create question |
| `/admin/questions/:id/edit` | Edit question |
| `/admin/tests` | Test listing |
| `/admin/tests/new` | Generate test |
| `/admin/marking` | Pending marking list |
| `/admin/marking/:id` | Mark descriptive answers |
| `/admin/results` | Results listing |
| `/admin/results/:id` | Result detail |

### Candidate Routes (public)

| Path | Page |
|---|---|
| `/candidate` | Enter Test ID |
| `/candidate/:testId/instructions` | Test instructions |
| `/candidate/:testId/test` | Take test |
| `/candidate/:testId/complete` | Submission confirmation |

## Key Design Decisions

| Decision | Approach |
|---|---|
| Test ID format | 8-char random string with collision check (`A8KM-P2Q7`) |
| Historical test integrity | `test_questions` stores snapshot; question edits don't affect generated tests |
| Autosave | Debounce 1s for descriptive, immediate for MCQ; show "Saving..."/"Saved" |
| Timer authority | Server calculates `ends_at`; client displays countdown; submit validates against server time |
| 1-hour expiry | `expires_at` = created_at + 1hr; candidate can only start before this |
| Randomization | `RAND()` per category for question selection; fixed category and option order |
| MCQ-only tests | After submission, skip "pending_review" → go straight to "completed" |
| Single admin | No roles or permissions in V1 |
