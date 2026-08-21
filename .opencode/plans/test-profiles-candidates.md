# Test Profiles + Candidate Records

## Context

Currently, every test creation requires manually selecting categories and question counts. There is no candidate management — `candidate_name` and `candidate_cnic` are free-text fields on the `tests` table. No CV storage, no candidate profiles, no test history view.

This plan adds:
1. **Test Profiles** — reusable templates (name + category counts + duration) applied when creating a test
2. **Candidate Management** — standalone candidate model with CV upload, summary, and downloadable CV
3. **Test → Candidate link** — tests reference a candidate record instead of storing name/cnic directly

---

## Phase 1: Test Profiles

### Database

**New migration: `create_test_profiles_table`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `name` | string | unique |
| `duration_minutes` | integer | default: 60 |
| `created_at / updated_at` | timestamps | |

**New migration: `create_test_profile_categories_table`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `test_profile_id` | FK → test_profiles | cascadeOnDelete |
| `category_id` | FK → categories | cascadeOnDelete |
| `question_count` | unsignedSmallInteger | min: 1 |
| **unique** | `[test_profile_id, category_id]` | one row per category per profile |

### Backend

**New files:**
- `app/Models/TestProfile.php` — fillable: `name`, `duration_minutes`. Relationships: `categories()` HasMany TestProfileCategory
- `app/Models/TestProfileCategory.php` — fillable: `test_profile_id`, `category_id`, `question_count`. Relationships: `profile()` BelongsTo TestProfile, `category()` BelongsTo Category
- `app/Http/Controllers/Api/TestProfileController.php` — full CRUD
  - `index()` — list all profiles with category breakdown
  - `store(StoreTestProfileRequest)` — create profile + sync categories
  - `show(TestProfile)` — single profile with categories
  - `update(UpdateTestProfileRequest, TestProfile)` — update profile + re-sync categories
  - `destroy(TestProfile)` — delete
- `app/Http/Resources/TestProfileResource.php` — JSON shape
- `app/Http/Requests/StoreTestProfileRequest.php` — validates name (required, unique), duration_minutes (required, min:1), categories array (required, min:1), each with category_id (exists) and question_count (required, min:1)
- `app/Http/Requests/UpdateTestProfileRequest.php` — same but unique ignores current

**Modified files:**
- `app/Services/TestGenerationService.php`:
  - Add optional `testProfileId` param. If provided, use profile's category counts + duration instead of manual categories
  - Keep manual categories as fallback for backward compatibility
- `app/Http/Controllers/Api/TestController.php`:
  - `generate()` accepts optional `test_profile_id` field
  - If `test_profile_id` provided, validate it exists, pass to service
  - Remove `categories` + `duration_minutes` from required when profile is used
- `app/Http/Requests/StoreTestRequest.php` (new or update existing validation):
  - Accept either `{ test_profile_id }` OR `{ categories, duration_minutes }`
- `routes/api.php` — add profile routes under admin group:
  ```
  Route::apiResource('test-profiles', TestProfileController::class);
  ```

**Form Request validation (conditional):**
```php
// Either test_profile_id OR categories + duration is required
$testProfileId = $input['test_profile_id'] ?? null;
if ($testProfileId) {
    $rules['test_profile_id'] = 'required|exists:test_profiles,id';
} else {
    $rules['categories'] = 'required|array|min:1';
    $rules['categories.*.category_id'] = 'required|exists:categories,id';
    $rules['categories.*.count'] = 'required|integer|min:1';
    $rules['duration_minutes'] = 'required|integer|min:1';
}
```

### Frontend

**New files:**
- `frontend/src/pages/admin/TestProfileList.tsx` — list all profiles in table, show name, duration, category breakdown, created date, delete button
- `frontend/src/pages/admin/TestProfileForm.tsx` — create/edit form with name, duration, dynamic category rows (same pattern as current TestCreate)

**Modified files:**
- `frontend/src/pages/admin/TestCreate.tsx`:
  - Add `test_profile_id` field (Select dropdown) at the top
  - When profile is selected, auto-populate category rows + duration (read-only)
  - When "manual" is selected, show current category rows
  - On submit, send `test_profile_id` OR `categories + duration_minutes`
- `frontend/src/App.tsx` — add routes:
  ```
  /admin/profiles → TestProfileList
  /admin/profiles/new → TestProfileForm
  /admin/profiles/:id/edit → TestProfileForm
  ```
- `frontend/src/layouts/AdminLayout.tsx` — add "Test Profiles" link to sidebar/nav

---

## Phase 2: Candidate Records

### Database

**New migration: `create_candidates_table`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `name` | string | required |
| `cnic` | string(15) | unique, indexed |
| `email` | string | nullable |
| `phone` | string | nullable |
| `cv_path` | string | nullable (stored in `storage/app/uploads/cvs/`) |
| `created_at / updated_at` | timestamps | |

**Modified migration: `add_candidate_id_to_tests_table`**

| Column | Type | Notes |
|--------|------|-------|
| `candidate_id` | foreignId | nullable, FK → candidates.id, nullOnDelete |

The `candidate_name` and `candidate_cnic` columns on `tests` are **kept** for backward compatibility (historical tests still have data). New tests created via the candidate flow will populate `candidate_id` as well.

### Backend

**New files:**
- `app/Models/Candidate.php` — fillable: `name`, `cnic`, `email`, `phone`, `cv_path`. Relationships: `tests()` HasMany Test
- `app/Http/Controllers/Api/CandidateManagementController.php` (named to avoid conflict with existing CandidateController for candidate portal):
  - `index()` — list candidates, search by name/cnic/email, paginated
  - `store(StoreCandidateRequest)` — create candidate
  - `show(Candidate)` — single candidate with test history summary
  - `update(UpdateCandidateRequest, Candidate)` — update candidate, handle CV upload
  - `destroy(Candidate)` — delete candidate
  - `downloadCv(Candidate)` — stream CV file download
- `app/Http/Resources/CandidateResource.php` — JSON shape
- `app/Http/Requests/StoreCandidateRequest.php` — validates name (required), cnic (required, unique, 15 chars), email (nullable, email), phone (nullable)
- `app/Http/Requests/UpdateCandidateRequest.php` — same, unique ignores current

**Modified files:**
- `app/Models/Test.php`:
  - Add `candidate()` BelongsTo relationship
  - Keep existing `candidate_name` / `candidate_cnic` fillable for backward compat
- `app/Services/TestGenerationService.php`:
  - Accept optional `candidateId` param
  - If provided, link test to candidate, populate `candidate_name` + `candidate_cnic` from candidate record
  - Store CV path on candidate if uploaded during test creation
- `app/Http/Controllers/Api/TestController.php`:
  - `generate()` accepts optional `candidate_id`
  - If `candidate_id` provided, validate it exists
- `app/Http/Resources/TestResource.php` — include `candidate` relationship data
- `app/Http/Resources/ResultResource.php` — include `candidate` data
- `routes/api.php` — add candidate management routes:
  ```
  Route::apiResource('candidates', CandidateManagementController::class);
  Route::get('candidates/{candidate}/cv', [CandidateManagementController::class, 'downloadCv']);
  ```

**Candidate Summary endpoint:**
- `GET /api/candidates/{candidate}` returns:
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "cnic": "12345-1234567-1",
    "email": "john@example.com",
    "phone": "0300-1234567",
    "cv_path": "cvs/john_cv.pdf",
    "tests": [
      {
        "id": 1,
        "test_id": "A8KM-P2Q7",
        "profile_name": "Software Engineer",
        "status": "completed",
        "total_marks": 100,
        "obtained_marks": 82,
        "mcq_marks": 60,
        "descriptive_marks": 22,
        "created_at": "2026-08-20T10:00:00"
      }
    ],
    "total_tests": 3,
    "average_score": 75.5
  }
  ```

### Frontend

**New files:**
- `frontend/src/pages/admin/CandidateList.tsx` — table with name, CNIC, email, phone, test count, actions (view/edit/delete)
- `frontend/src/pages/admin/CandidateForm.tsx` — create/edit form: name, CNIC, email, phone, CV file upload (drag-drop zone, accepts PDF/DOC/DOCX, max 5MB)
- `frontend/src/pages/admin/CandidateDetail.tsx` — summary page:
  - Top section: candidate info card (name, CNIC, email, phone, CV download link)
  - Bottom section: test history table (profile used, status, marks obtained, date)
  - If CV exists, show download button; if not, show upload zone

**Modified files:**
- `frontend/src/pages/admin/TestCreate.tsx`:
  - Add `candidate_id` Select field (searchable dropdown of existing candidates)
  - When candidate selected, auto-fill name/cnic (read-only)
  - Option to create new candidate inline (opens modal or links to /admin/candidates/new)
  - On submit, send `candidate_id` (backend populates name/cnic from record)
- `frontend/src/pages/admin/TestList.tsx`:
  - Show candidate name from relationship (not just raw field)
- `frontend/src/pages/admin/ResultDetail.tsx`:
  - Show candidate info card at top with CV download link
- `frontend/src/App.tsx` — add routes:
  ```
  /admin/candidates → CandidateList
  /admin/candidates/new → CandidateForm
  /admin/candidates/:id → CandidateDetail
  /admin/candidates/:id/edit → CandidateForm
  ```
- `frontend/src/layouts/AdminLayout.tsx` — add "Candidates" link to sidebar/nav

---

## Phase 3: Seed Data

**Modified file:** `database/seeders/TestSeeder.php` — create sample profiles and candidates for demo

---

## Implementation Order

1. Backend migrations (test_profiles, test_profile_categories, candidates, alter tests)
2. Models + relationships
3. TestProfileController + StoreTestProfileRequest + TestProfileResource
4. CandidateManagementController + StoreCandidateRequest + CandidateResource
5. Update TestGenerationService (profile + candidate support)
6. Update TestController (accept profile_id + candidate_id)
7. Update routes/api.php
8. Frontend: TestProfileList + TestProfileForm
9. Frontend: CandidateList + CandidateForm + CandidateDetail
10. Frontend: Update TestCreate (profile dropdown + candidate dropdown)
11. Frontend: Update TestList, ResultDetail
12. Frontend: Nav updates
13. Seed data
14. Lint, build, test, format
15. Commits

---

## Verification

- `npm run lint` — clean
- `npm run build` — clean
- `php artisan test --compact` — all tests pass (67+)
- `vendor/bin/pint --dirty --format agent` — clean
- Manual test: create profile → create test from profile → candidate portal flow still works
- Manual test: create candidate → attach CV → download CV
- Manual test: candidate summary shows test history with marks
