# Implementation Plan — Candidate Online Testing Portal

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2+) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Database | MySQL 8 |
| Auth | JWT via `tymon/jwt-auth` |
| Image Storage | Local filesystem (`storage/app/uploads`) |
| Deployment | Docker (nginx + php-fpm + mysql + node builder) |

---

## Project Structure

```
test_portal/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── QuestionController.php
│   │   │   ├── TestController.php
│   │   │   ├── CandidateTestController.php
│   │   │   ├── MarkingController.php
│   │   │   └── ResultController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Category.php
│   │   │   ├── Question.php
│   │   │   ├── QuestionOption.php
│   │   │   ├── Test.php
│   │   │   ├── TestQuestion.php
│   │   │   ├── CandidateAnswer.php
│   │   │   └── Result.php
│   │   └── Services/
│   │       ├── TestGenerationService.php
│   │       ├── MarkingService.php
│   │       └── ImageService.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── config/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Categories.jsx
│   │   │   │   ├── QuestionBank.jsx
│   │   │   │   ├── QuestionForm.jsx
│   │   │   │   ├── TestCreate.jsx
│   │   │   │   ├── TestList.jsx
│   │   │   │   ├── Marking.jsx
│   │   │   │   ├── MarkingDetail.jsx
│   │   │   │   ├── Results.jsx
│   │   │   │   └── ResultDetail.jsx
│   │   │   └── candidate/
│   │   │       ├── Entry.jsx
│   │   │       ├── Instructions.jsx
│   │   │       ├── Test.jsx
│   │   │       └── Completion.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/        # API client (axios)
│   │   └── context/
│   └── vite.config.js
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

---

## Database Schema

### `users` (admin)

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(255) | |
| email | varchar(255) unique | |
| password | varchar(255) | hashed |

### `categories`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(255) | |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

Seed: IQ, Accounting, Tax

### `questions`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| category_id | FK → categories | |
| type | enum('mcq','descriptive') | |
| text | text | question body |
| image_path | varchar(nullable) | local file path |
| marks | decimal(5,2) | > 0 |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

### `question_options`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| question_id | FK → questions | |
| label | char(1) | A, B, C, D |
| text | text | option text |
| image_path | varchar(nullable) | |
| is_correct | boolean | only for MCQ |

### `tests`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | varchar(8) unique | e.g. `A8KM-P2Q7` |
| candidate_name | varchar(255) | |
| candidate_cnic | varchar(15) | |
| duration_minutes | integer | |
| total_marks | decimal(7,2) | calculated |
| status | enum | see status enum below |
| created_at | timestamp | |
| started_at | timestamp(nullable) | |
| expires_at | timestamp | created_at + 1 hour |
| ends_at | timestamp(nullable) | started_at + duration |
| submitted_at | timestamp(nullable) | |
| submission_method | enum('manual','auto','admin', nullable) | |

**Status enum values:** `ready`, `expired`, `in_progress`, `submitted`, `auto_submitted`, `pending_review`, `completed`

### `test_questions`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests | |
| question_id | FK → questions | |
| category_id | FK → categories | |
| display_order | integer | order within category |

### `candidate_answers`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests | |
| question_id | FK → questions | |
| selected_option_id | FK → question_options (nullable) | for MCQ |
| descriptive_answer | text (nullable) | for descriptive |
| updated_at | timestamp | for autosave tracking |

### `results`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| test_id | FK → tests unique | |
| mcq_marks | decimal(7,2) | auto-calculated |
| descriptive_marks | decimal(7,2) | admin-awarded |
| total_obtained | decimal(7,2) | mcq + descriptive |
| is_finalized | boolean | true when all marking done |
| created_at, updated_at | timestamp | |

---

## API Routes

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login, returns JWT |
| POST | `/api/auth/logout` | Invalidate token |
| GET | `/api/auth/me` | Current admin info |

### Categories (admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List all (with question counts) |
| POST | `/api/categories` | Create |
| PUT | `/api/categories/{id}` | Update (name, active status) |

### Questions (admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions` | List with filters (category, type, status, search) |
| POST | `/api/questions` | Create (MCQ or descriptive) |
| PUT | `/api/questions/{id}` | Update question |
| PUT | `/api/questions/{id}/status` | Toggle active/inactive |
| POST | `/api/questions/{id}/image` | Upload/replace image |
| DELETE | `/api/questions/{id}/image` | Remove image |

### Tests (admin)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tests/generate` | Create test (validates, randomizes, returns test_id) |
| GET | `/api/tests` | List all tests with status |
| GET | `/api/tests/{id}` | Test detail + questions |

### Marking (admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/marking/pending` | List tests pending review |
| GET | `/api/marking/{testId}` | Get descriptive questions + answers for marking |
| PUT | `/api/marking/{testId}` | Submit marks for descriptive questions |
| POST | `/api/marking/{testId}/finalize` | Calculate final score, set completed |

### Results (admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/results` | List results (search by name, cnic, test_id; filter status/date) |
| GET | `/api/results/{testId}` | Full result detail (candidate info, all Q&A, scores) |

### Candidate Portal (public — no auth)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/candidate/validate` | Validate test_id → returns status |
| GET | `/api/candidate/{testId}/instructions` | Test info (candidate name, categories, duration, marks) |
| POST | `/api/candidate/{testId}/start` | Start test (sets started_at, status → in_progress) |
| GET | `/api/candidate/{testId}/questions` | All questions grouped by category + saved answers |
| PUT | `/api/candidate/{testId}/answer` | Save answer (MCQ selection or descriptive text) |
| POST | `/api/candidate/{testId}/submit` | Manual submission |
| GET | `/api/candidate/{testId}/status` | Check if completed (for completion screen) |

---

## Milestone Breakdown

### Milestone 1 — Question Bank (Days 1–3)

**Backend:**

1. Laravel project setup, MySQL config, Docker
2. Migration for `users`, `categories`, `questions`, `question_options`
3. Seed admin user + 3 default categories
4. JWT auth (login/logout/me)
5. Category CRUD API
6. Question CRUD API (MCQ + descriptive)
7. Image upload/delete API (local storage, validation: max 5MB, jpg/png)
8. Question listing with filters and search
9. Toggle active/inactive for questions and categories

**Frontend:**

1. React + Vite + Tailwind setup, axios API client, JWT interceptor
2. Login page
3. Category management page (add, rename, toggle active/inactive)
4. Question form (toggle MCQ/descriptive, dynamic options for MCQ)
5. Image upload with preview
6. Question bank listing (table with filters, pagination)
7. Question detail/edit view

---

### Milestone 2 — Test Generator (Days 4–5)

**Backend:**

1. Migration for `tests`, `test_questions`
2. `TestGenerationService`:
   - Validate candidate details + category/question counts
   - Check sufficient active questions per category
   - Randomly select questions using `ORDER BY RAND()` per category
   - Create test + test_questions records
   - Generate unique 8-char test_id (e.g. `A8KM-P2Q7`)
   - Set `expires_at` = now + 1 hour
   - Calculate total marks
3. Test listing API (with status filter)
4. Status transitions: ready → expired (via scheduled job)

**Frontend:**

1. Test creation page (candidate info form + category/question count builder)
2. Test ID display modal after generation (with copy button)
3. Tests listing page (table with status badges, filters)

---

### Milestone 3 — Candidate Assessment (Days 6–8)

**Backend:**

1. Candidate validation endpoint (test_id lookup, expiry check, status check)
2. Instructions endpoint (return test metadata)
3. Start test endpoint (record started_at, set status, calculate ends_at)
4. Questions endpoint (return all questions grouped by category with saved answers)
5. Answer save endpoint (upsert candidate_answer, support both MCQ and descriptive)
6. Handle browser refresh (re-enter test_id → check in_progress → restore session with remaining time)
7. Public routes (no JWT auth required, just test_id in URL/body)

**Frontend (candidate — separate route prefix `/candidate/`):**

1. Entry page (minimal: just Test ID input + Continue)
2. Instructions page (candidate info, category breakdown, instructions list, Start button)
3. Test page:
   - Left panel: question navigator (answered/unanswered/current indicators)
   - Main area: question display (text, image, MCQ radio buttons OR descriptive textarea)
   - Header: candidate name + countdown timer
   - Navigation: Previous / Save & Next
   - Autosave (debounced for descriptive, immediate for MCQ)
   - Saving/Saved indicator
4. Timer logic: client-side countdown, server-side authoritative (always validate on submit)
5. Mobile detection → show "use desktop" message
6. Handle connection loss gracefully (show warning, last saved state persists)

---

### Milestone 4 — Submission & Marking (Days 9–10)

**Backend:**

1. Manual submission endpoint (lock test, calculate MCQ marks, set status → submitted/pending_review)
2. Auto-submission (scheduled task or triggered when candidate polls and time is up)
3. MCQ auto-marking logic (compare selected_option vs question_option.is_correct)
4. Marking API:
   - List pending tests
   - Get descriptive questions + candidate answers
   - Save marks per question
   - Finalize (sum mcq_marks + descriptive_marks, set is_finalized, status → completed)
5. Handle edge case: test with only MCQs → auto-complete (skip pending_review)

**Frontend (admin):**

1. Marking list page (tests pending review)
2. Marking detail page:
   - For each descriptive question: show question, candidate answer, max marks, input field for awarded marks
   - Save partial marking (save button per question or batch save)
   - Finalize button when all questions are marked
3. Candidate completion screen (simple "Test Submitted Successfully" message, no scores)

---

### Milestone 5 — Results & QA (Days 11–12)

**Backend:**

1. Results listing API (search + filter)
2. Result detail API (full breakdown: candidate info, timestamps, all Q&A with correct answers for MCQ)
3. Dashboard stats API (question count, test counts by status, pending marking count)
4. Edge cases: expired tests, double-tab handling (server authoritative), concurrent submit+timeout

**Frontend (admin):**

1. Dashboard page (stat cards + recent tests table)
2. Results listing page (search by name/cnic/test_id, filter by date/status)
3. Result detail page:
   - Candidate info header (name, cnic, test_id, timestamps, duration)
   - Overall score (total/obtained/percentage)
   - Category-wise breakdown
   - Each question with: candidate answer, correct answer (MCQ), marks awarded
4. Mobile detection for candidate portal

**Docker:**

1. `Dockerfile` (multi-stage: build frontend, serve with nginx + php-fpm)
2. `docker-compose.yml` (services: nginx, php, mysql, node-builder)
3. `.env.example` with all required env vars
4. Startup script (run migrations + seed on first boot)

---

## Key Implementation Notes

| Concern | Approach |
|---|---|
| **Test ID uniqueness** | 8-char random string with collision check loop |
| **Historical test integrity** | `test_questions` stores snapshot; question edits don't affect generated tests |
| **Autosave** | Debounce 1s for descriptive, immediate for MCQ; show "Saving..."/"Saved" |
| **Timer authority** | Server calculates `ends_at`; client displays countdown; submit validates against server time |
| **1-hour expiry** | `expires_at` = created_at + 1hr; candidate can only start before this; scheduled job marks expired tests |
| **Randomization** | `RAND()` per category for question selection; fixed category order; fixed option order |
| **Desktop check** | CSS media query + JS `navigator.userAgent` check → show warning overlay on small screens |
| **Partial marking** | Admin saves marks per question; finalize button only enabled when all descriptive marked |
| **MCQ-only tests** | After submission, skip "pending_review" → go straight to "completed" |

---

## Estimated Timeline

| Milestone | Duration | Cumulative |
|---|---|---|
| 1 — Question Bank | 3 days | Day 3 |
| 2 — Test Generator | 2 days | Day 5 |
| 3 — Candidate Assessment | 3 days | Day 8 |
| 4 — Submission & Marking | 2 days | Day 10 |
| 5 — Results & QA | 2 days | Day 12 |
| **Total** | **~12 working days** | |
