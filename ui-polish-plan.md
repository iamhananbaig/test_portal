# UI/UX Polish Plan

## Overview
Full UI polish with lucide-react as the only new dependency. Focus on new component library, consistent styling, animations, skeleton loaders, toast notifications, and better mobile UX.

## Phase 1: Foundation — Design Tokens + New Components

### 1.1 Install lucide-react
```bash
cd frontend && npm install lucide-react
```

### 1.2 Add design tokens to `index.css`
```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
}
```

### 1.3 Create new UI components (all in `frontend/src/components/ui/`):

| Component | Purpose | Props |
|---|---|---|
| `Spinner.tsx` | Loading spinner (replaces "Loading..." text) | `size?: 'sm' \| 'md' \| 'lg'` |
| `Skeleton.tsx` | Pulse animation placeholder | `className?: string` |
| `Textarea.tsx` | Consistent with Input component | Same as Input (label, error, forwardRef) |
| `Table.tsx` | Shared table with head/body/row | `caption?, columns, children` |
| `Pagination.tsx` | Extracted from 4 duplicated locations | `page, totalPages, onPageChange` |
| `Toast.tsx` | Simple success/error notification | `message, type, onClose` |
| `PageHeader.tsx` | Title + description + action button slot | `title, description?, action?` |
| `EmptyState.tsx` | Icon + message + CTA (replaces "No X found") | `icon, message, action?` |
| `StatusBadge.tsx` | Status with color mapping (extracted from 4 pages) | `status: string` |

### 1.4 Update existing components:
- `Button.tsx` — Add `loading` prop with spinner, add `icon` slot
- `Modal.tsx` — Add transition/animation, size prop (`sm`, `md`, `lg`)
- `Card.tsx` — Add `CardFooter`, add hover/interactive variant
- `Badge.tsx` — Add `size` prop, add `outline` variant

## Phase 2: Extract Duplicated Patterns

### 2.1 Status variant map → `utils/status.ts`
```ts
// Extract from Dashboard, TestList, Results, ResultDetail
export function getStatusColor(status: string): 'success' | 'warning' | ...
export function formatStatus(status: string): string
```

### 2.2 Table pattern → update `Table.tsx`
- Extract the copy-pasted table classes into the component
- Add responsive wrapper (`overflow-x-auto`)

### 2.3 Pagination → update `Pagination.tsx`
- Extract from QuestionBank, TestList, Results, Marking

### 2.4 Loading/Empty states → use `Spinner` + `EmptyState`
- Replace all `<p>Loading...</p>` with `<Spinner>` or `<Skeleton>`
- Replace all `<p>No X found</p>` with `<EmptyState>`

## Phase 3: Visual Polish

### 3.1 AdminLayout
- Add subtle shadows, smoother transitions, better sidebar styling

### 3.2 Dashboard
- Add stat card icons (via lucide-react), subtle gradients, better visual hierarchy

### 3.3 Tables
- Zebra striping, hover states, better spacing

### 3.4 Forms
- Better focus rings, helper text support, consistent spacing

### 3.5 Cards
- Subtle hover effects, better shadow hierarchy

### 3.6 Modals
- Fade-in/scale animation, better backdrop blur

### 3.7 CandidateTest
- Replace ⚑ emoji with lucide `Flag` icon, better sidebar styling, smoother transitions

## Phase 4: UX Improvements

### 4.1 Loading skeletons
For Dashboard, QuestionBank, TestList, Results, Marking

### 4.2 Toast notifications
For success/error actions (save category, toggle status, save marks)

### 4.3 Empty states
With icons and CTAs (e.g., "No questions yet — create your first question")

### 4.4 Responsive tables
Horizontal scroll wrapper on mobile

### 4.5 Candidate pages
Use shared Card, Button, Modal components instead of inline styles

## Phase 5: Candidate Portal Polish

### 5.1 CandidateLogin
Use shared Card component, better visual design

### 5.2 CandidateInstructions
Use shared Card, better layout, add icons to instruction steps

### 5.3 CandidateTest
Replace flag emoji with icon, better timer styling, smoother question transitions, better mobile navigation

### 5.4 CandidateComplete
Use shared components, better success animation

## Files to modify (28 files)

### New files (10):
- `frontend/src/components/ui/Spinner.tsx`
- `frontend/src/components/ui/Skeleton.tsx`
- `frontend/src/components/ui/Textarea.tsx`
- `frontend/src/components/ui/Table.tsx`
- `frontend/src/components/ui/Pagination.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/ui/PageHeader.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/components/ui/StatusBadge.tsx`
- `frontend/src/utils/status.ts`

### Modified files (18):
- `frontend/src/index.css` — Add @theme tokens
- `frontend/src/components/ui/Button.tsx` — Add loading + icon props
- `frontend/src/components/ui/Modal.tsx` — Add animation + size prop
- `frontend/src/components/ui/Card.tsx` — Add CardFooter
- `frontend/src/components/ui/Badge.tsx` — Add size + outline
- `frontend/src/layouts/AdminLayout.tsx` — Polish sidebar
- `frontend/src/pages/admin/Dashboard.tsx` — Skeleton loader, stat icons
- `frontend/src/pages/admin/QuestionBank.tsx` — Use Table, Pagination, EmptyState
- `frontend/src/pages/admin/TestList.tsx` — Use Table, Pagination, StatusBadge
- `frontend/src/pages/admin/TestCreate.tsx` — Use Toast for success
- `frontend/src/pages/admin/Results.tsx` — Use Table, Pagination, StatusBadge
- `frontend/src/pages/admin/ResultDetail.tsx` — Use StatusBadge
- `frontend/src/pages/admin/Marking.tsx` — Use Table, Pagination
- `frontend/src/pages/admin/MarkingDetail.tsx` — Use Toast
- `frontend/src/pages/admin/Categories.tsx` — Use Toast, EmptyState
- `frontend/src/pages/candidate/CandidateLogin.tsx` — Use shared Card
- `frontend/src/pages/candidate/CandidateInstructions.tsx` — Use shared Card
- `frontend/src/pages/candidate/CandidateTest.tsx` — Replace emoji with lucide icons
- `frontend/src/pages/candidate/CandidateComplete.tsx` — Use shared components

## Estimated effort
~900-1100 lines of new code, ~400 lines of modifications across existing files.
