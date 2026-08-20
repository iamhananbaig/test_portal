# Frontend — React SPA

React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4.

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, proxies /api to backend)
npm run build        # Production build (tsc -b && vite build)
npm run lint         # Lint with oxlint
```

## Directory Structure

```
frontend/src/
├── pages/
│   ├── admin/               # 11 admin pages
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Categories.tsx
│   │   ├── QuestionBank.tsx
│   │   ├── QuestionForm.tsx
│   │   ├── TestList.tsx
│   │   ├── TestCreate.tsx
│   │   ├── Marking.tsx
│   │   ├── MarkingDetail.tsx
│   │   ├── Results.tsx
│   │   └── ResultDetail.tsx
│   └── candidate/           # 4 candidate pages
│       ├── CandidateLogin.tsx
│       ├── CandidateInstructions.tsx
│       ├── CandidateTest.tsx
│       └── CandidateComplete.tsx
├── components/ui/           # 15 reusable components
│   ├── Badge, Button, Card, EmptyState, Input
│   ├── Modal, PageHeader, Pagination, Select
│   ├── Skeleton, Spinner, StatusBadge, Table
│   ├── Textarea, Toast
│   └── ErrorBoundary, GuestRoute, RequireAuth, ThemeToggle
├── context/                 # AuthContext, ThemeContext
├── hooks/                   # Custom React hooks
├── layouts/                 # AdminLayout
├── services/                # api.ts (axios with JWT interceptor)
└── index.css                # Tailwind v4 @theme tokens
```

## Routing

| Path | Page | Auth |
|---|---|---|
| `/admin/login` | Login | Guest only |
| `/admin` | Dashboard | Required |
| `/admin/categories` | Categories | Required |
| `/admin/questions` | Question Bank | Required |
| `/admin/tests` | Test List | Required |
| `/admin/tests/new` | Generate Test | Required |
| `/admin/marking` | Marking List | Required |
| `/admin/results` | Results List | Required |
| `/candidate` | Enter Test ID | Public |
| `/candidate/:testId/test` | Take Test | Public |

## API Client

Two axios instances in `services/api.ts`:

- `api` (default) — admin API client. Attaches JWT Bearer token, redirects to `/admin/login` on 401.
- `candidateApi` — public candidate API client. No auth headers.

## Styling

Tailwind v4 with custom `@theme` tokens in `index.css`:
- Font: **Plus Jakarta Sans**
- Primary: blue (`primary-*`)
- Neutrals: slate (`slate-*`)
- Status: emerald (success), amber (warning), rose (danger), violet (info)

## Full Documentation

- [API Reference](../docs/api.md) — backend endpoints
- [Architecture](../docs/architecture.md) — system design
- [Development Setup](../docs/setup.md) — prerequisites, env config
