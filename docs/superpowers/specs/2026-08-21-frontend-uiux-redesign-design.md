# Frontend UI/UX Redesign — Design Spec

**Date:** 2026-08-21
**Scope:** Full frontend redesign — visual direction, component consistency, dark mode, form/data libraries, responsive fixes, portal fixes

---

## 1. Design Direction

### Palette

Shift from indigo to **Trust Blue** (`#2563EB`). Semantic colors remain emerald/amber/rose.

| Token | Light | Dark |
|---|---|---|
| `primary-50` | `#eff6ff` | `#1e3a5f` |
| `primary-100` | `#dbeafe` | `#1e40af` |
| `primary-200` | `#bfdbfe` | `#2563eb` |
| `primary-500` | `#3b82f6` | `#60a5fa` |
| `primary-600` | `#2563eb` | `#3b82f6` |
| `primary-700` | `#1d4ed8` | `#2563eb` |
| `primary-800` | `#1e40af` | `#1d4ed8` |
| `primary-900` | `#1e3a8a` | `#1e3a5f` |

### Typography

Switch from Inter to **Plus Jakarta Sans** (Google Fonts). Tighter heading scale (1.125–1.2 ratio).

### Style

Clean Operate mode — restrained color, consistent component vocabulary, density appropriate for data-heavy admin pages. No glassmorphism decoration.

---

## 2. Architecture Changes

### New Libraries

| Library | Purpose |
|---|---|
| `react-hook-form` + `@hookform/resolvers` + `zod` | Systematic form validation |
| `@tanstack/react-query` | Data fetching, caching, loading/error states |

### New Files

| File | Purpose |
|---|---|
| `src/context/ThemeContext.tsx` | Dark mode state + toggle, localStorage persistence |
| `src/lib/validations.ts` | Shared Zod schemas for all forms |

### Modified Files

| File | Change |
|---|---|
| `src/services/api.ts` | Add `candidateApi` export (unauthenticated axios instance) |
| `src/App.tsx` | Wrap app in `QueryClientProvider` + `ThemeProvider` |
| `src/index.css` | Update primary palette to blue, add dark mode CSS variables |
| `src/components/ui/Modal.tsx` | Use `createPortal` to render at document body |
| All UI components | Add `dark:` variants |
| All page components | Migrate to React Query + RHF + skeletons + URL filters |

---

## 3. Issue Fixes

### Issue 1: Marking.tsx hardcoded "Pending Review"

Replace inline `<span>` with `<StatusBadge status="pending_review" />`.

### Issue 2: CandidateInstructions raw `<table>`

Replace native `<table>` with shared `<Table>` component using `columns` config.

### Issue 3: QuestionForm raw `<input>` for MCQ options

Replace `<input type="text">` with shared `<Input>` component.

### Issue 4: Candidate pages use raw `fetch()`

Create unauthenticated `candidateApi` instance:
```ts
export const candidateApi = axios.create({
  baseURL: '/api',
});
```
Use in: CandidateLogin, CandidateInstructions, CandidateTest, CandidateComplete.

### Issue 5: No dark mode

- `ThemeContext` with `theme: 'light' | 'dark'`, persisted to `localStorage`
- Toggle button (sun/moon icon) in AdminLayout header and candidate test header
- All components get `dark:` variants
- CSS variables in `index.css` for dark backgrounds

### Issue 6: No loading skeletons

Add skeleton loading states to all pages:
- Categories: table skeleton (5 rows × 4 columns)
- QuestionBank: table skeleton (5 rows × 6 columns)
- QuestionForm: form skeleton (5 fields)
- TestList: table skeleton (5 rows × 5 columns)
- TestCreate: form skeleton (2 sections)
- Marking: table skeleton (3 rows × 5 columns)
- MarkingDetail: card skeleton (3 cards)
- Results: table skeleton (5 rows × 6 columns)
- ResultDetail: stat + table skeleton
- CandidateInstructions: text skeleton
- CandidateTest: question skeleton

### Issue 7: No form validation library

Migrate all forms to React Hook Form with Zod schemas:
- `StoreCategoryRequest` → `{ name: z.string().min(1) }`
- `StoreQuestionRequest` → `{ category_id, type, text, marks, options[] }`
- `GenerateTestRequest` → `{ candidate_name, candidate_cnic, categories[], duration }`
- `MarkingRequest` → `{ marks: [{question_id, awarded_marks}] }`
- Candidate login → `{ test_id: z.string().min(1) }`

### Issue 8: No URL-based filtering

Use `useSearchParams` from react-router to sync filter state:
- QuestionBank: `?category=&type=&status=&search=&page=`
- TestList: `?status=&search=&page=`
- Results: `?status=&search=&page=`
- Marking: `?page=` (no filters currently)

### Issue 9: No responsive candidate test sidebar

Replace `hidden md:block` + `<select>` with:
- Desktop: fixed sidebar (question navigator)
- Mobile: slide-in drawer triggered by hamburger button, with backdrop overlay
- Smooth transition animation (250ms ease-out)

### Issue 10: Modal no React portal

Use `createPortal(<Modal />, document.body)` to render modals at body level, preventing z-index stacking issues with sticky headers.

### Issue 11: Consistent component usage

Audit all pages for:
- Raw `<button>` → `<Button>`
- Raw `<input>` → `<Input>`
- Raw `<select>` → `<Select>`
- Raw `<table>` → `<Table>`
- Hardcoded status text → `<StatusBadge>`
- Raw error divs → consistent error pattern

---

## 4. Dark Mode Implementation

### ThemeContext

```tsx
type Theme = 'light' | 'dark';
// Stores theme in state + localStorage
// Provides toggle() function
// Applies 'dark' class to <html> element
```

### Toggle Placement

- AdminLayout: sun/moon icon button in header (next to logout)
- CandidateTest: sun/moon icon button in header bar

### Dark Mode Token Strategy

Use Tailwind `dark:` variants with CSS custom properties in `index.css`:

```css
@theme {
  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-border: #e2e8f0;
}

.dark {
  --color-surface: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
}
```

---

## 5. Implementation Order

1. **Foundation** — ThemeContext, dark mode tokens, Modal portal fix
2. **Library setup** — Install deps, configure providers in App.tsx
3. **API layer** — Add candidateApi to services/api.ts
4. **Component updates** — All UI components get dark: variants
5. **Page migrations** — Each page: React Query, RHF, skeletons, URL filters, consistent components
6. **Responsive fixes** — Candidate test sidebar mobile pattern
7. **Final audit** — Lint, typecheck, visual review

---

## 6. Testing

- `npm run lint` after each page migration
- `npm run build` to verify no type errors
- Manual test: toggle dark mode across all pages
- Manual test: full candidate flow (login → instructions → test → complete)
- Manual test: admin CRUD operations, marking, results
