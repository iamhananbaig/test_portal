# API Reference

Base URL: `http://localhost:8000/api`

All requests must include:
```
Content-Type: application/json
Accept: application/json
```

Authenticated endpoints require:
```
Authorization: Bearer <token>
```

## Error Responses

Validation errors return 422 with:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

Auth errors return 401:
```json
{
  "message": "Invalid credentials."
}
```

---

## Auth

### Login

```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "admin@test.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@test.com"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (401):**
```json
{
  "message": "Invalid credentials."
}
```

---

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out"
}
```

---

### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@test.com"
}
```

---

## Categories

### List Categories

```
GET /api/categories
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "IQ",
      "is_active": true,
      "questions_count": 25,
      "created_at": "2026-08-20T10:00:00.000000Z",
      "updated_at": "2026-08-20T10:00:00.000000Z"
    }
  ],
  "links": { "...pagination links..." },
  "meta": { "...pagination meta..." }
}
```

---

### Create Category

```
POST /api/categories
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Corporate Law",
  "is_active": true
}
```

**Response (201):**
```json
{
  "data": {
    "id": 4,
    "name": "Corporate Law",
    "is_active": true,
    "questions_count": 0,
    "created_at": "2026-08-21T12:00:00.000000Z",
    "updated_at": "2026-08-21T12:00:00.000000Z"
  }
}
```

---

### Update Category

```
PUT /api/categories/{id}
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Corporate Law (Updated)",
  "is_active": false
}
```

**Response (200):**
```json
{
  "data": {
    "id": 4,
    "name": "Corporate Law (Updated)",
    "is_active": false,
    "questions_count": 0,
    "created_at": "2026-08-21T12:00:00.000000Z",
    "updated_at": "2026-08-21T12:30:00.000000Z"
  }
}
```

---

### Toggle Category Status

```
PUT /api/categories/{id}/status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "id": 4,
    "name": "Corporate Law",
    "is_active": false,
    "questions_count": 0,
    "created_at": "2026-08-21T12:00:00.000000Z",
    "updated_at": "2026-08-21T12:30:00.000000Z"
  }
}
```

---

## Questions

### List Questions

```
GET /api/questions
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |
| category_id | int | — | Filter by category |
| type | string | — | `mcq` or `descriptive` |
| is_active | bool | — | Filter by active status |
| search | string | — | Search question text |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "category": {
        "id": 1,
        "name": "IQ",
        "is_active": true,
        "created_at": "2026-08-20T10:00:00.000000Z",
        "updated_at": "2026-08-20T10:00:00.000000Z"
      },
      "type": "mcq",
      "text": "Which of the following is a current asset?",
      "image_path": null,
      "marks": 2,
      "is_active": true,
      "options": [
        {
          "id": 1,
          "label": "A",
          "text": "Share Capital",
          "image_path": null,
          "is_correct": false
        },
        {
          "id": 2,
          "label": "B",
          "text": "Inventory",
          "image_path": null,
          "is_correct": true
        }
      ],
      "created_at": "2026-08-20T10:00:00.000000Z",
      "updated_at": "2026-08-20T10:00:00.000000Z"
    }
  ],
  "links": { "...pagination links..." },
  "meta": { "...pagination meta..." }
}
```

---

### Get Question

```
GET /api/questions/{id}
Authorization: Bearer <token>
```

**Response (200):** Same structure as a single item from the list endpoint, including `category` and `options` relations.

---

### Create Question (MCQ)

```
POST /api/questions
Authorization: Bearer <token>
```

**Request:**
```json
{
  "category_id": 1,
  "type": "mcq",
  "text": "Which of the following is a current asset?",
  "marks": 2,
  "options": [
    { "label": "A", "text": "Share Capital", "is_correct": false },
    { "label": "B", "text": "Inventory", "is_correct": true },
    { "label": "C", "text": "Long-term Loan", "is_correct": false },
    { "label": "D", "text": "Retained Earnings", "is_correct": false }
  ]
}
```

**Validation rules:**
- `category_id` — required, must exist in categories
- `type` — required, `mcq` or `descriptive`
- `text` — required, string
- `marks` — required, numeric, > 0
- `options` — required when type is `mcq`, array of exactly 4
- MCQ must have exactly one option with `is_correct: true`

**Response (201):** Question object with options.

---

### Create Question (Descriptive)

```
POST /api/questions
Authorization: Bearer <token>
```

**Request:**
```json
{
  "category_id": 1,
  "type": "descriptive",
  "text": "Explain the difference between capital expenditure and revenue expenditure.",
  "marks": 5
}
```

**Response (201):** Question object without options.

---

### Update Question

```
PUT /api/questions/{id}
Authorization: Bearer <token>
```

**Request:** Same as create. For MCQ, existing options are replaced entirely.

**Response (200):** Updated question object.

---

### Toggle Question Status

```
PUT /api/questions/{id}/status
Authorization: Bearer <token>
```

**Response (200):** Question object with `is_active` toggled.

---

### Upload Question Image

```
POST /api/questions/{id}/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Rules |
|---|---|---|
| image | file | required, image, jpg/jpeg/png, max 5MB |

**Response (200):**
```json
{
  "image_path": "questions/abc123.jpg"
}
```

---

### Delete Question Image

```
DELETE /api/questions/{id}/image
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Image removed"
}
```

---

### Upload Option Image

```
POST /api/questions/{question}/options/{option}/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Rules |
|---|---|---|
| image | file | required, image, jpg/jpeg/png, max 5MB |

**Response (200):**
```json
{
  "image_path": "questions/options/abc123.jpg"
}
```

---

### Delete Option Image

```
DELETE /api/questions/{question}/options/{option}/image
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Image removed"
}
```

---

## Bulk Question Upload

### Download Sample File

```
GET /api/questions/sample-download
Authorization: Bearer <token>
```

**Response:** Excel file download (.xlsx)

---

### Validate Upload

```
POST /api/questions/validate-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Rules |
|---|---|---|
| file | file | required, xlsx/xls/csv |

**Response (200):**
```json
{
  "valid": true,
  "rows": 25,
  "errors": []
}
```

---

### Import Questions

```
POST /api/questions/bulk-import
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Rules |
|---|---|---|
| file | file | required, xlsx/xls/csv |

**Response (201):**
```json
{
  "message": "25 questions imported successfully.",
  "imported": 25
}
```

---

## Test Profiles

### List Test Profiles

```
GET /api/test-profiles
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |

**Response (200):** Paginated TestProfileResource objects.

---

### Create Test Profile

```
POST /api/test-profiles
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Standard 60min Test",
  "duration_minutes": 60,
  "categories": [
    { "category_id": 1, "count": 20 },
    { "category_id": 2, "count": 15 }
  ]
}
```

**Response (201):** TestProfile object with categories.

---

### Get Test Profile

```
GET /api/test-profiles/{id}
Authorization: Bearer <token>
```

**Response (200):** TestProfile object with categories.

---

### Update Test Profile

```
PUT /api/test-profiles/{id}
Authorization: Bearer <token>
```

**Request:** Same as create.

**Response (200):** Updated TestProfile object.

---

### Delete Test Profile

```
DELETE /api/test-profiles/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Test profile deleted."
}
```

---

## Tests

### Generate Test

```
POST /api/tests/generate
Authorization: Bearer <token>
```

**Request:**
```json
{
  "candidate_name": "Ahmed Ali",
  "candidate_cnic": "35202-1234567-1",
  "categories": [
    { "category_id": 1, "count": 20 },
    { "category_id": 2, "count": 15 },
    { "category_id": 3, "count": 10 }
  ],
  "duration_minutes": 60
}
```

**Validation:**
- `candidate_name` — required, string
- `candidate_cnic` — required, string
- `categories` — required, array, min 1
- `categories.*.category_id` — required, must exist
- `categories.*.count` — required, integer, min 1
- `duration_minutes` — required, integer, min 1

**Response (201):**
```json
{
  "message": "Test generated successfully",
  "data": {
    "id": 1,
    "test_id": "A8KM-P2Q7",
    "candidate_name": "Ahmed Ali",
    "candidate_cnic": "35202-1234567-1",
    "duration_minutes": 60,
    "total_marks": 90,
    "status": "ready",
    "created_at": "2026-08-21T15:00:00.000000Z",
    "started_at": null,
    "expires_at": "2026-08-21T16:00:00.000000Z",
    "ends_at": null,
    "submitted_at": null,
    "submission_method": null,
    "questions": [ "..." ]
  }
}
```

**Response (422) — insufficient questions:**
```json
{
  "message": "20 Tax questions requested, but only 14 active questions are available."
}
```

---

### List Tests

```
GET /api/tests
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |
| status | string | — | Filter by status |
| search | string | — | Search name, CNIC, or test_id |

**Response (200):** Paginated TestResource objects.

---

### Get Test

```
GET /api/tests/{id}
Authorization: Bearer <token>
```

**Response (200):** Test object with `test_questions` (including `question` and `category` relations).

---

### Start Test (Admin)

```
POST /api/tests/{id}/start
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Test started.",
  "data": { "..." }
}
```

**Response (422):**
```json
{
  "message": "Test cannot be started."
}
```

---

## Marking

### List Pending Tests

```
GET /api/marking/pending
Authorization: Bearer <token>
```

**Response (200):** Paginated TestResource objects with `status: pending_review`.

---

### Get Test for Marking

```
GET /api/marking/{testId}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "test": { "...TestResource..." },
  "questions": [
    {
      "id": 1,
      "text": "Explain the difference between capital expenditure and revenue expenditure.",
      "type": "descriptive",
      "marks": 5,
      "candidate_answer": "Capital expenditure is...",
      "awarded_marks": null
    }
  ]
}
```

---

### Save Marks

```
PUT /api/marking/{testId}
Authorization: Bearer <token>
```

**Request:**
```json
{
  "marks": [
    { "question_id": 10, "awarded_marks": 4 },
    { "question_id": 11, "awarded_marks": 3 }
  ]
}
```

**Validation:**
- `marks` — required, array
- `marks.*.question_id` — required, must exist
- `marks.*.awarded_marks` — required, numeric, min 0

**Response (200):**
```json
{
  "message": "Marks saved successfully."
}
```

---

### Finalize Test

```
POST /api/marking/{testId}/finalize
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Test finalized successfully.",
  "result": {
    "mcq_marks": 16,
    "descriptive_marks": 12,
    "total_obtained": 28,
    "is_finalized": true
  }
}
```

---

## Results

### Dashboard Stats

```
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total_questions": 50,
  "active_questions": 45,
  "total_categories": 3,
  "tests_by_status": {
    "ready": 2,
    "in_progress": 1,
    "pending_review": 3,
    "completed": 10,
    "expired": 1,
    "submitted": 0
  },
  "total_tests": 17,
  "pending_marking": 3
}
```

---

### List Results

```
GET /api/results
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |
| search | string | — | Search by name, CNIC, or test_id |
| status | string | — | Filter by status |

**Response (200):** Paginated ResultResource objects.

---

### Get Result Detail

```
GET /api/results/{testId}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "test": {
    "id": 1,
    "test_id": "A8KM-P2Q7",
    "candidate_name": "Ahmed Ali",
    "candidate_cnic": "35202-1234567-1",
    "duration_minutes": 60,
    "total_marks": 90,
    "status": "completed",
    "created_at": "2026-08-21T15:00:00.000000Z",
    "started_at": "2026-08-21T15:05:00.000000Z",
    "submitted_at": "2026-08-21T15:55:00.000000Z",
    "submission_method": "manual"
  },
  "result": {
    "mcq_marks": 16,
    "descriptive_marks": 12,
    "total_obtained": 28,
    "is_finalized": true
  },
  "category_breakdown": [
    {
      "category": "IQ",
      "total_marks": 40,
      "obtained_marks": 12
    },
    {
      "category": "Accounting",
      "total_marks": 30,
      "obtained_marks": 10
    }
  ],
  "questions": [
    {
      "question_id": 1,
      "text": "Which of the following is a current asset?",
      "type": "mcq",
      "marks": 2,
      "category": "Accounting",
      "display_order": 1,
      "options": [
        { "id": 1, "label": "A", "text": "Share Capital", "is_correct": false },
        { "id": 2, "label": "B", "text": "Inventory", "is_correct": true }
      ],
      "selected_option_id": 2,
      "descriptive_answer": null,
      "awarded_marks": 2
    }
  ]
}
```

---

## Candidate Management

### List Candidates

```
GET /api/candidates
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| per_page | int | 15 | Items per page (max 100) |
| search | string | — | Search by name, CNIC, email |

**Response (200):** Paginated CandidateResource objects.

---

### Create Candidate

```
POST /api/candidates
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Ahmed Ali",
  "cnic": "35202-1234567-1",
  "email": "ahmed@example.com",
  "phone": "+923001234567"
}
```

**Response (201):** Candidate object.

---

### Get Candidate

```
GET /api/candidates/{id}
Authorization: Bearer <token>
```

**Response (200):** Candidate object with tests relation.

---

### Update Candidate

```
PUT /api/candidates/{id}
Authorization: Bearer <token>
```

**Request:** Same as create.

**Response (200):** Updated Candidate object.

---

### Delete Candidate

```
DELETE /api/candidates/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Candidate deleted."
}
```

---

### Upload CV

```
POST /api/candidates/{id}/cv
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Rules |
|---|---|---|
| cv | file | required, pdf/doc/docx, max 10MB |

**Response (200):**
```json
{
  "cv_path": "candidates/cv_abc123.pdf"
}
```

---

### Download CV

```
GET /api/candidates/{id}/cv
Authorization: Bearer <token>
```

**Response:** File download.

---

### Update Excel Score

```
PUT /api/candidates/{id}/excel-score
Authorization: Bearer <token>
```

**Request:**
```json
{
  "excel_score": 85.5,
  "excel_remarks": "Strong candidate"
}
```

**Response (200):** Updated Candidate object.

---

## Candidate Portal (Public)

These routes require **no authentication**. The candidate is identified by the `test_id` in the URL.

Candidate portal routes are rate-limited (`throttle:candidate`).

---

### Validate Test ID

```
POST /api/candidate/validate
```

**Request:**
```json
{
  "test_id": "A8KM-P2Q7"
}
```

**Response (200) — valid:**
```json
{
  "status": "ready",
  "candidate_name": "Ahmed Ali",
  "test_id": "A8KM-P2Q7"
}
```

**Response (404):**
```json
{
  "message": "Test not found.",
  "status": "not_found"
}
```

**Response (410) — expired:**
```json
{
  "message": "This test has expired.",
  "status": "expired"
}
```

**Response (409) — already completed:**
```json
{
  "message": "This test has already been completed.",
  "status": "completed"
}
```

---

### Get Instructions

```
GET /api/candidate/{testId}/instructions
```

**Response (200):**
```json
{
  "test_id": "A8KM-P2Q7",
  "candidate_name": "Ahmed Ali",
  "duration_minutes": 60,
  "total_marks": 90,
  "status": "ready",
  "category_breakdown": [
    { "category": "IQ", "count": 20, "marks": 40 },
    { "category": "Accounting", "count": 15, "marks": 30 }
  ]
}
```

---

### Start Test

```
POST /api/candidate/{testId}/start
```

**Response (200) — started:**
```json
{
  "message": "Test started.",
  "test_id": "A8KM-P2Q7",
  "status": "in_progress",
  "duration_minutes": 60,
  "remaining_seconds": 3600,
  "candidate_name": "Ahmed Ali"
}
```

**Response (200) — already in progress (resume):**
Same response structure.

---

### Get Questions

```
GET /api/candidate/{testId}/questions
```

**Response (200):**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "Which of the following is a current asset?",
      "image_path": null,
      "type": "mcq",
      "marks": 2,
      "category": "Accounting",
      "category_id": 2,
      "display_order": 1,
      "options": [
        { "id": 1, "label": "A", "text": "Share Capital", "image_path": null },
        { "id": 2, "label": "B", "text": "Inventory", "image_path": null }
      ],
      "selected_option_id": null,
      "descriptive_answer": null,
      "is_flagged": false
    }
  ],
  "remaining_seconds": 3500,
  "candidate_name": "Ahmed Ali",
  "test_id": "A8KM-P2Q7"
}
```

**Response (408) — time expired:**
```json
{
  "message": "Time has expired. Test auto-submitted.",
  "auto_submitted": true
}
```

---

### Save Answer

```
PUT /api/candidate/{testId}/answer
```

**Request (MCQ):**
```json
{
  "question_id": 1,
  "selected_option_id": 2
}
```

**Request (Descriptive):**
```json
{
  "question_id": 15,
  "descriptive_answer": "Capital expenditure refers to funds used to acquire or upgrade..."
}
```

**Request (with time tracking):**
```json
{
  "question_id": 1,
  "selected_option_id": 2,
  "time_spent_seconds": 45
}
```

**Response (200):**
```json
{
  "message": "Answer saved.",
  "saved": true
}
```

---

### Flag/Unflag Question

```
PUT /api/candidate/{testId}/flag
```

**Request:**
```json
{
  "question_id": 5
}
```

**Response (200):**
```json
{
  "is_flagged": true
}
```

---

### Submit Test

```
POST /api/candidate/{testId}/submit
```

**Response (200):**
```json
{
  "message": "Test submitted successfully.",
  "submitted": true
}
```

---

### Check Status

```
GET /api/candidate/{testId}/status
```

**Response (200):**
```json
{
  "status": "in_progress",
  "submitted_at": null,
  "ends_at": "2026-08-21T16:05:00.000000Z"
}
```

**Response (200) — auto-submitted:**
```json
{
  "status": "completed",
  "auto_submitted": true
}
```

---

### Time Remaining

```
GET /api/candidate/{testId}/time
```

**Response (200):**
```json
{
  "remaining_seconds": 2400,
  "status": "in_progress"
}
```

---

## Health Check

```
GET /api/health
```

**Response (200):**
```json
{
  "status": "ok"
}
```
