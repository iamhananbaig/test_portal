# Frontend UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the frontend with trust blue palette, dark mode, React Hook Form + React Query, consistent component usage, loading skeletons, URL-based filtering, responsive candidate sidebar, and React portal for modals.

**Architecture:** Add ThemeContext for dark mode, candidateApi for unauthenticated requests, and configure React Query + React Hook Form providers. Migrate all pages to use these libraries. Update all UI components with dark mode variants. Fix component consistency issues across all pages.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, React Router v8, React Hook Form + Zod, TanStack React Query, axios, lucide-react

**Spec:** `docs/superpowers/specs/2026-08-21-frontend-uiux-redesign-design.md`

## Global Constraints

- Tailwind CSS v4 with `@theme` directive (no `tailwind.config.js`)
- Primary color: Trust Blue `#2563EB` (replaces indigo)
- Font: Plus Jakarta Sans (Google Fonts)
- All components must have `dark:` variants
- No comments in code
- Use existing shared UI components (`Button`, `Input`, `Select`, `Table`, `Card`, `Modal`, `Badge`, `StatusBadge`, `Spinner`, `Skeleton`, `EmptyState`, `PageHeader`, `Pagination`, `Toast`)
- oxlint for linting (not ESLint)
- `npm run lint` must pass after each task
- `npm run build` must pass after each task

---

## Task 1: Install Dependencies + Configure Providers

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/lib/validations.ts`

**Interfaces:**
- Consumes: none (foundation task)
- Produces: `QueryClientProvider` and `ThemeProvider` wrappers in App.tsx, shared Zod schemas in `lib/validations.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd frontend && npm install react-hook-form @hookform/resolvers zod @tanstack/react-query
```

- [ ] **Step 2: Create shared Zod schemas**

Create `frontend/src/lib/validations.ts`:

```typescript
import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
})

export const questionSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  text: z.string().min(1, 'Question text is required'),
  marks: z.string().min(1, 'Marks are required').refine((v) => Number(v) > 0, 'Marks must be greater than 0'),
  options: z.array(z.object({
    label: z.string(),
    text: z.string().min(1, 'Option text is required'),
    is_correct: z.boolean(),
  })).optional(),
})

export const testGenerateSchema = z.object({
  candidate_name: z.string().min(1, 'Candidate name is required'),
  candidate_cnic: z.string().min(1, 'CNIC is required'),
  duration: z.string().min(1, 'Duration is required'),
  category_rows: z.array(z.object({
    category_id: z.string().min(1, 'Category is required'),
    count: z.string().min(1, 'Count is required').refine((v) => Number(v) > 0, 'Count must be at least 1'),
  })).min(1, 'Add at least one category'),
})

export const candidateLoginSchema = z.object({
  test_id: z.string().min(1, 'Test ID is required'),
})

export const markingSchema = z.object({
  marks: z.record(z.string(), z.string()),
})
```

- [ ] **Step 3: Update App.tsx with providers**

Modify `frontend/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import RequireAuth from './components/RequireAuth'
import GuestRoute from './components/GuestRoute'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Categories from './pages/admin/Categories'
import QuestionBank from './pages/admin/QuestionBank'
import QuestionForm from './pages/admin/QuestionForm'
import TestCreate from './pages/admin/TestCreate'
import TestList from './pages/admin/TestList'
import Marking from './pages/admin/Marking'
import MarkingDetail from './pages/admin/MarkingDetail'
import Results from './pages/admin/Results'
import ResultDetail from './pages/admin/ResultDetail'
import CandidateLogin from './pages/candidate/CandidateLogin'
import CandidateInstructions from './pages/candidate/CandidateInstructions'
import CandidateTest from './pages/candidate/CandidateTest'
import CandidateComplete from './pages/candidate/CandidateComplete'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route
                path="/admin/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="questions" element={<QuestionBank />} />
                <Route path="questions/new" element={<QuestionForm />} />
                <Route path="questions/:id/edit" element={<QuestionForm />} />
                <Route path="tests" element={<TestList />} />
                <Route path="tests/new" element={<TestCreate />} />
                <Route path="marking" element={<Marking />} />
                <Route path="marking/:id" element={<MarkingDetail />} />
                <Route path="results" element={<Results />} />
                <Route path="results/:id" element={<ResultDetail />} />
              </Route>
              <Route path="/candidate" element={<CandidateLogin />} />
              <Route path="/candidate/:testId/instructions" element={<CandidateInstructions />} />
              <Route path="/candidate/:testId/test" element={<CandidateTest />} />
              <Route path="/candidate/:testId/complete" element={<CandidateComplete />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS (ThemeContext not yet created, so build will fail — create it in Task 2)

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/App.tsx frontend/src/lib/validations.ts
git commit -m "feat: install react-hook-form, react-query, zod; add providers and shared schemas"
```

---

## Task 2: ThemeContext + Dark Mode Tokens

**Files:**
- Create: `frontend/src/context/ThemeContext.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: none
- Produces: `useTheme()` hook returning `{ theme, toggle }`, dark mode CSS variables

- [ ] **Step 1: Create ThemeContext**

Create `frontend/src/context/ThemeContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark' || stored === 'light') return stored
    } catch {}
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  const toggle = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Update index.css with blue palette + dark mode variables**

Replace `frontend/src/index.css`:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;

  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  --color-slate-25: #fcfcfd;
  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-300: #cbd5e1;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;
  --color-slate-950: #020617;

  --color-emerald-50: #ecfdf5;
  --color-emerald-100: #d1fae5;
  --color-emerald-500: #10b981;
  --color-emerald-600: #059669;
  --color-emerald-700: #047857;

  --color-amber-50: #fffbeb;
  --color-amber-100: #fef3c7;
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;
  --color-amber-700: #b45309;

  --color-rose-50: #fff1f2;
  --color-rose-100: #ffe4e6;
  --color-rose-500: #f43f5e;
  --color-rose-600: #e11d48;
  --color-rose-700: #be123c;

  --color-violet-50: #f5f3ff;
  --color-violet-600: #7c3aed;

  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

@layer base {
  * {
    @apply border-slate-200 dark:border-slate-700;
  }
  body {
    @apply bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100;
  }
}
```

- [ ] **Step 3: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/ThemeContext.tsx frontend/src/index.css
git commit -m "feat: add ThemeContext, trust blue palette, dark mode CSS variables"
```

---

## Task 3: Add candidateApi + Fix Modal Portal

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: ThemeContext (not needed here)
- Produces: `candidateApi` export, `createPortal`-based Modal

- [ ] **Step 1: Add candidateApi to services/api.ts**

Replace `frontend/src/services/api.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)

export const candidateApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export default api
```

- [ ] **Step 2: Update Modal to use React Portal + dark mode**

Replace `frontend/src/components/ui/Modal.tsx`:

```typescript
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  footer?: ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      closeRef.current?.focus()
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          {title ? (
            <h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 3: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/components/ui/Modal.tsx
git commit -m "feat: add candidateApi, fix Modal to use React Portal"
```

---

## Task 4: Dark Mode — All UI Components

**Files:**
- Modify: `frontend/src/components/ui/Badge.tsx`
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/ui/Card.tsx`
- Modify: `frontend/src/components/ui/EmptyState.tsx`
- Modify: `frontend/src/components/ui/Input.tsx`
- Modify: `frontend/src/components/ui/PageHeader.tsx`
- Modify: `frontend/src/components/ui/Pagination.tsx`
- Modify: `frontend/src/components/ui/Select.tsx`
- Modify: `frontend/src/components/ui/Skeleton.tsx`
- Modify: `frontend/src/components/ui/Spinner.tsx`
- Modify: `frontend/src/components/ui/StatusBadge.tsx`
- Modify: `frontend/src/components/ui/Table.tsx`
- Modify: `frontend/src/components/ui/Textarea.tsx`
- Modify: `frontend/src/components/ui/Toast.tsx`

**Interfaces:**
- Consumes: none
- Produces: all UI components with dark: variants

- [ ] **Step 1: Read all UI component files**

Read each file listed above to understand current structure.

- [ ] **Step 2: Add dark: variants to each component**

For each component, add `dark:` variants to background, text, and border classes. Key patterns:

**Badge.tsx** — Add `dark:bg-*` variants for each badge variant:
```
success: dark:bg-emerald-900/30 dark:text-emerald-400
warning: dark:bg-amber-900/30 dark:text-amber-400
danger: dark:bg-rose-900/30 dark:text-rose-400
info: dark:bg-primary-900/30 dark:text-primary-400
gray: dark:bg-slate-700 dark:text-slate-300
outline: dark:border-slate-600 dark:text-slate-300
```

**Button.tsx** — Add dark: variants:
```
primary: dark:bg-primary-500 dark:hover:bg-primary-600
secondary: dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600
danger: dark:bg-rose-600 dark:hover:bg-rose-700
ghost: dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100
```

**Card.tsx** — Add `dark:bg-slate-800 dark:border-slate-700`

**Input.tsx / Textarea.tsx / Select.tsx** — Add `dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-primary-400 dark:focus:ring-primary-400`

**Table.tsx** — Add `dark:bg-slate-800 dark:border-slate-700`, header `dark:bg-slate-750`, row hover `dark:hover:bg-slate-750`

**Skeleton.tsx** — Add `dark:bg-slate-700`

**Spinner.tsx** — No change needed (uses text-primary-600 which is fine)

**EmptyState.tsx** — Add `dark:text-slate-300` for text

**PageHeader.tsx** — Add `dark:text-slate-100` for title, `dark:text-slate-400` for description

**Pagination.tsx** — Inherits from Button

**Toast.tsx** — Add dark variants for success/error backgrounds

**StatusBadge.tsx** — Inherits from Badge

- [ ] **Step 3: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat: add dark mode variants to all UI components"
```

---

## Task 5: AdminLayout — Dark Mode + Theme Toggle

**Files:**
- Modify: `frontend/src/layouts/AdminLayout.tsx`

**Interfaces:**
- Consumes: `useTheme()` from ThemeContext
- Produces: updated AdminLayout with dark mode + toggle button

- [ ] **Step 1: Update AdminLayout**

Replace `frontend/src/layouts/AdminLayout.tsx` with dark mode variants and a sun/moon toggle button in the header area (next to logout). Use `Sun` and `Moon` icons from lucide-react.

Key changes:
- Sidebar: `dark:bg-slate-800 dark:border-slate-700`
- Nav items: `dark:text-slate-300 dark:hover:bg-slate-700`, active: `dark:bg-primary-900/30 dark:text-primary-400`
- Header bar: `dark:bg-slate-800 dark:border-slate-700`
- Main content: `dark:bg-slate-900`
- Add theme toggle button with `Sun`/`Moon` icons

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/layouts/AdminLayout.tsx
git commit -m "feat: add dark mode and theme toggle to AdminLayout"
```

---

## Task 6: Fix Issue 1 — Marking.tsx StatusBadge

**Files:**
- Modify: `frontend/src/pages/admin/Marking.tsx`

**Interfaces:**
- Consumes: `StatusBadge` component
- Produces: Marking page using StatusBadge instead of hardcoded Badge

- [ ] **Step 1: Replace Badge with StatusBadge**

In `Marking.tsx`, line 104, replace:
```tsx
<Badge variant="warning">Pending Review</Badge>
```
with:
```tsx
<StatusBadge status={test.status} />
```

Also remove the `Badge` import and add `StatusBadge` import.

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/Marking.tsx
git commit -m "fix: use StatusBadge instead of hardcoded Badge in Marking"
```

---

## Task 7: Fix Issue 2 — CandidateInstructions Table

**Files:**
- Modify: `frontend/src/pages/candidate/CandidateInstructions.tsx`

**Interfaces:**
- Consumes: `Table`, `TableRow`, `TableCell` components
- Produces: CandidateInstructions using shared Table component

- [ ] **Step 1: Replace raw table with shared Table component**

Replace the `<table>` element (lines 158-185) with:

```tsx
<Table
  columns={[
    { key: 'category', header: 'Category' },
    { key: 'questions', header: 'Questions', className: 'text-center' },
    { key: 'marks', header: 'Marks', className: 'text-center' },
  ]}
>
  {data?.category_breakdown.map((cat, i) => (
    <TableRow key={i}>
      <TableCell>{cat.category}</TableCell>
      <TableCell className="text-center">{cat.count}</TableCell>
      <TableCell className="text-center font-medium">{cat.marks}</TableCell>
    </TableRow>
  ))}
</Table>
```

Add imports for `Table`, `TableRow`, `TableCell` from `../../components/ui/Table`.

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/candidate/CandidateInstructions.tsx
git commit -m "fix: use shared Table component in CandidateInstructions"
```

---

## Task 8: Fix Issue 3 — QuestionForm MCQ Options

**Files:**
- Modify: `frontend/src/pages/admin/QuestionForm.tsx`

**Interfaces:**
- Consumes: `Input` component
- Produces: QuestionForm using shared Input for MCQ options

- [ ] **Step 1: Replace raw input with shared Input**

In `QuestionForm.tsx`, replace the raw `<input type="text">` for MCQ options (lines 193-199) with:

```tsx
<Input
  value={opt.text}
  onChange={(e) => updateOptionText(i, e.target.value)}
  placeholder={`Option ${opt.label}`}
/>
```

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/QuestionForm.tsx
git commit -m "fix: use shared Input component for MCQ options in QuestionForm"
```

---

## Task 9: Fix Issue 4 — Candidate Pages Use candidateApi

**Files:**
- Modify: `frontend/src/pages/candidate/CandidateLogin.tsx`
- Modify: `frontend/src/pages/candidate/CandidateInstructions.tsx`
- Modify: `frontend/src/pages/candidate/CandidateTest.tsx`

**Interfaces:**
- Consumes: `candidateApi` from `../../services/api`
- Produces: all candidate pages using candidateApi instead of raw fetch()

- [ ] **Step 1: Update CandidateLogin.tsx**

Replace raw `fetch` calls with `candidateApi`:

```typescript
import { candidateApi } from '../../services/api'

// In handleSubmit:
const res = await candidateApi.post('/candidate/validate', {
  test_id: testId.trim().toUpperCase(),
})
const data = res.data
// Handle status based on data.status
```

Remove the manual `Content-Type` and `Accept` headers (already set on candidateApi).

- [ ] **Step 2: Update CandidateInstructions.tsx**

Replace raw `fetch` calls with `candidateApi`:

```typescript
import { candidateApi } from '../../services/api'

// In useEffect:
const res = await candidateApi.get(`/candidate/${testId}/instructions`)
// Handle 408 via axios error: catch (err) { if (err.response?.status === 408) ... }
setData(res.data)

// In handleStart:
const res = await candidateApi.post(`/candidate/${testId}/start`)
navigate(`/candidate/${testId}/test`)
```

- [ ] **Step 3: Update CandidateTest.tsx**

Replace raw `fetch` calls with `candidateApi`. This page has multiple fetch calls:
- Load questions: `candidateApi.get(...)`
- Save answer: `candidateApi.put(...)`
- Flag question: `candidateApi.put(...)`
- Submit test: `candidateApi.post(...)`

For each, convert from `fetch` to `candidateApi` and handle errors via axios error pattern.

- [ ] **Step 4: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/candidate/CandidateLogin.tsx frontend/src/pages/candidate/CandidateInstructions.tsx frontend/src/pages/candidate/CandidateTest.tsx
git commit -m "fix: migrate candidate pages from raw fetch to candidateApi"
```

---

## Task 10: Dark Mode — Admin Pages

**Files:**
- Modify: `frontend/src/pages/admin/Login.tsx`
- Modify: `frontend/src/pages/admin/Dashboard.tsx`
- Modify: `frontend/src/pages/admin/Categories.tsx`
- Modify: `frontend/src/pages/admin/QuestionBank.tsx`
- Modify: `frontend/src/pages/admin/QuestionForm.tsx`
- Modify: `frontend/src/pages/admin/TestList.tsx`
- Modify: `frontend/src/pages/admin/TestCreate.tsx`
- Modify: `frontend/src/pages/admin/Marking.tsx`
- Modify: `frontend/src/pages/admin/MarkingDetail.tsx`
- Modify: `frontend/src/pages/admin/Results.tsx`
- Modify: `frontend/src/pages/admin/ResultDetail.tsx`

**Interfaces:**
- Consumes: UI components with dark: variants
- Produces: all admin pages with dark mode support

- [ ] **Step 1: Add dark: variants to each admin page**

Key patterns for each page:
- Background containers: `dark:bg-slate-800` or `dark:bg-slate-900`
- Text: `dark:text-slate-100` for primary, `dark:text-slate-400` for secondary
- Borders: `dark:border-slate-700`
- Error messages: `dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800`
- Success messages: `dark:bg-emerald-900/20 dark:text-emerald-400`
- Input backgrounds in modals: inherited from Input component

For each page, scan for:
- `bg-white` → `bg-white dark:bg-slate-800`
- `bg-slate-50` → `bg-slate-50 dark:bg-slate-900`
- `text-slate-900` → `text-slate-900 dark:text-slate-100`
- `text-slate-500` → `text-slate-500 dark:text-slate-400`
- `border-slate-200` → `border-slate-200 dark:border-slate-700`
- `bg-rose-50` → `bg-rose-50 dark:bg-rose-900/20`
- `text-rose-700` → `text-rose-700 dark:text-rose-400`
- `bg-emerald-50` → `bg-emerald-50 dark:bg-emerald-900/20`

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/
git commit -m "feat: add dark mode support to all admin pages"
```

---

## Task 11: Dark Mode — Candidate Pages

**Files:**
- Modify: `frontend/src/pages/candidate/CandidateLogin.tsx`
- Modify: `frontend/src/pages/candidate/CandidateInstructions.tsx`
- Modify: `frontend/src/pages/candidate/CandidateTest.tsx`
- Modify: `frontend/src/pages/candidate/CandidateComplete.tsx`

**Interfaces:**
- Consumes: UI components with dark: variants
- Produces: all candidate pages with dark mode support

- [ ] **Step 1: Add dark: variants to each candidate page**

Key patterns:
- Gradient backgrounds: add `dark:` variants (e.g., `dark:from-slate-900 dark:via-slate-800 dark:to-primary-900/20`)
- Card backgrounds: `dark:bg-slate-800`
- Text: `dark:text-slate-100` for primary
- Add theme toggle button to CandidateTest header (sun/moon icon)

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/candidate/
git commit -m "feat: add dark mode support to all candidate pages"
```

---

## Task 12: Loading Skeletons — All Pages

**Files:**
- Modify: `frontend/src/pages/admin/Categories.tsx`
- Modify: `frontend/src/pages/admin/QuestionBank.tsx`
- Modify: `frontend/src/pages/admin/QuestionForm.tsx`
- Modify: `frontend/src/pages/admin/TestList.tsx`
- Modify: `frontend/src/pages/admin/TestCreate.tsx`
- Modify: `frontend/src/pages/admin/Marking.tsx`
- Modify: `frontend/src/pages/admin/MarkingDetail.tsx`
- Modify: `frontend/src/pages/admin/Results.tsx`
- Modify: `frontend/src/pages/admin/ResultDetail.tsx`
- Modify: `frontend/src/pages/candidate/CandidateInstructions.tsx`
- Modify: `frontend/src/pages/candidate/CandidateTest.tsx`

**Interfaces:**
- Consumes: `Skeleton` component
- Produces: skeleton loading states for all pages

- [ ] **Step 1: Add skeleton loading to each page**

For each page, replace the `<Spinner />` loading state with skeleton markup. Examples:

**Categories skeleton:**
```tsx
<div className="py-12 flex justify-center">
  <div className="w-full space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
</div>
```

**QuestionBank skeleton:** Similar row pattern with 6 columns.

**QuestionForm skeleton:**
```tsx
<div className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
  </div>
  <Skeleton className="h-24" />
  <Skeleton className="h-10 w-32" />
</div>
```

**TestList skeleton:** Row pattern with 5 columns.

**TestCreate skeleton:**
```tsx
<div className="space-y-4">
  <Skeleton className="h-5 w-40" />
  <div className="grid grid-cols-2 gap-4">
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
  </div>
  <Skeleton className="h-5 w-40" />
  <Skeleton className="h-10" />
  <Skeleton className="h-10 w-32" />
</div>
```

**Marking skeleton:** Row pattern with 5 columns.

**MarkingDetail skeleton:**
```tsx
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <Card key={i}>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16" />
        <Skeleton className="h-10" />
      </CardContent>
    </Card>
  ))}
</div>
```

**Results skeleton:** Row pattern with 6 columns.

**ResultDetail skeleton:**
```tsx
<div className="space-y-6">
  <div className="grid grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
  <Card>
    <CardContent className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </CardContent>
  </Card>
</div>
```

**CandidateInstructions skeleton:**
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="w-full max-w-2xl space-y-4">
    <Skeleton className="h-40" />
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
  </div>
</div>
```

**CandidateTest skeleton:**
```tsx
<div className="min-h-screen flex">
  <aside className="w-64 border-r p-4 space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-8" />
    ))}
  </aside>
  <main className="flex-1 p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-40" />
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  </main>
</div>
```

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/ frontend/src/pages/candidate/
git commit -m "feat: add loading skeletons to all pages"
```

---

## Task 13: URL-Based Filtering

**Files:**
- Modify: `frontend/src/pages/admin/QuestionBank.tsx`
- Modify: `frontend/src/pages/admin/TestList.tsx`
- Modify: `frontend/src/pages/admin/Results.tsx`

**Interfaces:**
- Consumes: `useSearchParams` from react-router
- Produces: filter state synced to URL search params

- [ ] **Step 1: Update QuestionBank to use URL params**

Replace local filter state with `useSearchParams`:

```typescript
import { useSearchParams } from 'react-router'

// Replace useState for filters with:
const [searchParams, setSearchParams] = useSearchParams()

const filters = {
  category_id: searchParams.get('category_id') || '',
  type: searchParams.get('type') || '',
  is_active: searchParams.get('is_active') || '',
  search: searchParams.get('search') || '',
}

const setPage = (p: number) => {
  setSearchParams((prev) => {
    prev.set('page', String(p))
    return prev
  })
}

const updateFilter = (key: string, value: string) => {
  setSearchParams((prev) => {
    if (value) {
      prev.set(key, value)
    } else {
      prev.delete(key)
    }
    prev.delete('page')
    return prev
  })
}
```

- [ ] **Step 2: Update TestList to use URL params**

Same pattern as QuestionBank. Sync `status`, `search`, and `page` to URL.

- [ ] **Step 3: Update Results to use URL params**

Same pattern. Sync `status`, `search`, and `page` to URL.

- [ ] **Step 4: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/QuestionBank.tsx frontend/src/pages/admin/TestList.tsx frontend/src/pages/admin/Results.tsx
git commit -m "feat: sync filter state to URL search params"
```

---

## Task 14: Responsive Candidate Test Sidebar

**Files:**
- Modify: `frontend/src/pages/candidate/CandidateTest.tsx`

**Interfaces:**
- Consumes: none
- Produces: responsive sidebar with slide-in drawer on mobile

- [ ] **Step 1: Add mobile sidebar drawer**

Replace the current `hidden md:block` sidebar and `<select>` dropdown with:

1. Add `sidebarOpen` state
2. Desktop: fixed sidebar (unchanged, remove `hidden md:block`)
3. Mobile: hamburger button in header that opens slide-in drawer
4. Drawer: full-height panel sliding from left with backdrop overlay
5. Smooth transition: `transition-transform duration-250 ease-out`

Key changes in CandidateTest.tsx:

```tsx
const [sidebarOpen, setSidebarOpen] = useState(false)

// In header, add hamburger button for mobile:
<button
  onClick={() => setSidebarOpen(true)}
  className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
  aria-label="Open question navigator"
>
  <Menu className="h-5 w-5" />
</button>

// Sidebar: always render, use transform for mobile
<aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0 p-4 transition-transform duration-250 ease-out md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  {/* sidebar content */}
</aside>

// Backdrop for mobile:
{sidebarOpen && (
  <div
    className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}

// Remove the <select> dropdown entirely
```

- [ ] **Step 2: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/candidate/CandidateTest.tsx
git commit -m "feat: responsive candidate test sidebar with slide-in drawer"
```

---

## Task 15: Migrate Forms to React Hook Form

**Files:**
- Modify: `frontend/src/pages/admin/Categories.tsx`
- Modify: `frontend/src/pages/admin/QuestionForm.tsx`
- Modify: `frontend/src/pages/admin/TestCreate.tsx`
- Modify: `frontend/src/pages/candidate/CandidateLogin.tsx`
- Modify: `frontend/src/pages/admin/MarkingDetail.tsx`

**Interfaces:**
- Consumes: `useForm` from react-hook-form, `zodResolver` from @hookform/resolvers/zod, schemas from `lib/validations.ts`
- Produces: forms using React Hook Form with Zod validation

- [ ] **Step 1: Migrate Categories modal form**

Replace individual `useState` for `name` with `useForm`:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema } from '../../lib/validations'

// In component:
const { register, handleSubmit, reset, formState: { errors } } = useForm({
  resolver: zodResolver(categorySchema),
})

const onSubmit = async (data: { name: string }) => {
  // save logic
  reset()
}
```

Update the `<Input>` to use `register`:
```tsx
<Input
  label="Category Name"
  {...register('name')}
  error={errors.name?.message}
  placeholder="e.g. Accounting"
/>
```

- [ ] **Step 2: Migrate QuestionForm**

Replace individual `useState` for form fields with `useForm`:

```typescript
const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
  resolver: zodResolver(questionSchema),
  defaultValues: {
    category_id: '',
    type: 'mcq',
    text: '',
    marks: '',
    options: [
      { label: 'A', text: '', is_correct: false },
      { label: 'B', text: '', is_correct: false },
      { label: 'C', text: '', is_correct: false },
      { label: 'D', text: '', is_correct: false },
    ],
  },
})
```

- [ ] **Step 3: Migrate TestCreate**

Replace individual `useState` with `useForm` using `testGenerateSchema`.

- [ ] **Step 4: Migrate CandidateLogin**

Replace `useState` for `testId` with `useForm` using `candidateLoginSchema`.

- [ ] **Step 5: Migrate MarkingDetail marks inputs**

Replace `Record<number, string>` state with `useForm` for the marks form.

- [ ] **Step 6: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/admin/Categories.tsx frontend/src/pages/admin/QuestionForm.tsx frontend/src/pages/admin/TestCreate.tsx frontend/src/pages/candidate/CandidateLogin.tsx frontend/src/pages/admin/MarkingDetail.tsx
git commit -m "feat: migrate all forms to react-hook-form with zod validation"
```

---

## Task 16: Migrate Data Fetching to React Query (Admin Pages)

**Files:**
- Modify: `frontend/src/pages/admin/Dashboard.tsx`
- Modify: `frontend/src/pages/admin/Categories.tsx`
- Modify: `frontend/src/pages/admin/QuestionBank.tsx`
- Modify: `frontend/src/pages/admin/TestList.tsx`
- Modify: `frontend/src/pages/admin/Results.tsx`
- Modify: `frontend/src/pages/admin/Marking.tsx`
- Modify: `frontend/src/pages/admin/MarkingDetail.tsx`
- Modify: `frontend/src/pages/admin/ResultDetail.tsx`
- Modify: `frontend/src/pages/admin/TestCreate.tsx`

**Interfaces:**
- Consumes: `useQuery`, `useMutation`, `useQueryClient` from @tanstack/react-query
- Produces: all admin pages using React Query for data fetching

- [ ] **Step 1: Migrate Dashboard**

Replace `useEffect` + `useState` with `useQuery`:

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

const { data: stats, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data as DashboardStats
  },
})
```

Replace `loading` checks with `isLoading`.

- [ ] **Step 2: Migrate Categories**

```typescript
const { data: categories = [], isLoading, refetch } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await api.get('/categories')
    return response.data.data as Category[]
  },
})
```

For mutations (create, update, toggle):
```typescript
const queryClient = useQueryClient()

const createMutation = useMutation({
  mutationFn: (data: { name: string }) => api.post('/categories', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    setToast({ message: 'Category created.', type: 'success' })
  },
})
```

- [ ] **Step 3: Migrate QuestionBank**

Replace `refetchCategories` and `refetchQuestions` with `useQuery`.

- [ ] **Step 4: Migrate TestList**

Replace `refetch` with `useQuery`.

- [ ] **Step 5: Migrate Results**

Replace `refetch` with `useQuery`.

- [ ] **Step 6: Migrate Marking**

Replace `refetch` with `useQuery`.

- [ ] **Step 7: Migrate MarkingDetail**

Replace `refetch` with `useQuery` + `useMutation` for save/finalize.

- [ ] **Step 8: Migrate ResultDetail**

Replace `fetchData` with `useQuery`.

- [ ] **Step 9: Migrate TestCreate**

Replace category fetching with `useQuery`, form submission with `useMutation`.

- [ ] **Step 10: Run lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/admin/
git commit -m "feat: migrate all admin pages to react-query"
```

---

## Task 17: Final Audit + Cleanup

**Files:**
- All modified files

**Interfaces:**
- Consumes: all previous tasks
- Produces: clean, consistent codebase

- [ ] **Step 1: Run full lint**

```bash
cd frontend && npm run lint
```

Expected: PASS

- [ ] **Step 2: Run full build**

```bash
cd frontend && npm run build
```

Expected: PASS

- [ ] **Step 3: Check for any remaining raw HTML elements**

Grep for raw `<button>`, `<input>`, `<select>`, `<table>` in page files that should use shared components.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final audit cleanup"
```
