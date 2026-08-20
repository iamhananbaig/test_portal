# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Administrator** (HR/recruiter): Creates question banks, generates candidate tests, marks descriptive answers, reviews results. Single admin in V1.
- **Candidate** (job applicant): Receives a Test ID, takes a timed assessment (MCQ + descriptive), submits for marking.

## Product Purpose

A hiring assessment portal that makes the assessment workflow reliable: Prepare Questions, Generate Candidate Test, Candidate Completes Timed Assessment, Mark Answers, Review Result. Success is a dependable, clear process for both admin and candidate.

## Positioning

Controlled assessment workflow — not a general examination platform. Focused on hiring-specific needs: unique Test IDs, timed sessions, one-hour start validity, automatic MCQ marking, manual descriptive marking.

## Operating Context

- Admin works from a laptop/desktop, managing question content and candidate tests
- Candidate receives a Test ID manually from admin, opens portal, enters ID, completes timed test
- Tests are desktop-only (mobile restriction is a UX choice, not anti-cheat)
- Auto-save during test, browser refresh recovery, timer-based auto-submit
- Historical test data is immutable once generated

## Capabilities and Constraints

- Admin login (JWT auth), no multi-role or permissions in V1
- Category management (CRUD, activate/deactivate)
- Question bank: MCQ (4 options, 1 correct) + Descriptive, with image support
- Test generation: random question selection per category, unique Test ID, 1-hour start validity
- Candidate test: timed, auto-save, navigation, flag for review, auto-submit on expiry
- Marking: MCQ auto-marked, descriptive manually marked by admin
- Results: overall score, category breakdown, question-by-question review
- Single admin only, no candidate accounts, no email/SMS, no anti-cheating in V1

## Brand Commitments

- Product name: "Test Portal"
- No established brand assets, voice, or visual identity yet — design is open

## Evidence on Hand

- Complete product specification: `project.md`
- Technical implementation plan: `plan.md`
- React frontend with basic scaffolding: `frontend/src/`
- Laravel API with all routes defined: `api/routes/api.php`

## Product Principles

1. **Clarity over decoration** — every element serves the assessment workflow
2. **Reliable saving** — candidate answers are never lost
3. **Immutable history** — generated tests and submitted answers never change
4. **Desktop-first** — optimized for the actual usage context
5. **Minimal scope** — V1 ships the core workflow, nothing else

## Accessibility & Inclusion

- Desktop-only (mobile shows restriction message)
- Standard keyboard navigation
- No specific accessibility standard established yet
