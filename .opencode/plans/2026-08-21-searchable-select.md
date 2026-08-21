# SearchableSelect Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable, searchable dropdown/select component and use it for the candidate selector in the Create Test page, enabling search by name and CNIC.

**Architecture:** Build a custom `SearchableSelect` component from scratch (no new dependencies) using React state, lucide-react icons, and Tailwind v4 styling matching existing `Select.tsx` patterns. The component accepts `options` with optional `searchTerms` for multi-field search. Integrate it into `TestCreate.tsx` for the candidate dropdown only — other selects remain unchanged.

**Tech Stack:** React 19, Tailwind v4, lucide-react, react-hook-form (via `setValue`/`useWatch` pattern — no `Controller` needed)

## Global Constraints

- No new npm packages — build from scratch using React + Tailwind + lucide-react
- Match existing `Select.tsx` styling exactly: `rounded-lg`, `border border-slate-300`, `bg-white`, `focus:border-primary-500 focus:ring-1 focus:ring-primary-500`, dark mode variants, `space-y-1.5` label/error layout
- Component must be reusable — not candidate-specific
- Existing `Select.tsx` is untouched — only used where search is not needed
- oxlint is the linter (not ESLint)
- No unused imports allowed (oxlint rule `no-unused-imports`)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/ui/SearchableSelect.tsx` | **Create** | Reusable searchable dropdown component |
| `frontend/src/pages/admin/TestCreate.tsx:221-233` | **Modify** | Replace candidate `<Select>` with `<SearchableSelect>` |

---

### Task 1: Create SearchableSelect Component

**Files:**
- Create: `frontend/src/components/ui/SearchableSelect.tsx`

**Interfaces:**

```typescript
interface SearchableSelectOption {
  value: string | number
  label: string
  searchTerms?: string
}

interface SearchableSelectProps {
  label?: string
  error?: string
  placeholder?: string
  options: SearchableSelectOption[]
  value?: string | number
  onChange?: (value: string | number) => void
  name?: string
  disabled?: boolean
}
```

- [ ] **Step 1: Create the SearchableSelect component file**

Create `frontend/src/components/ui/SearchableSelect.tsx` with:

```tsx
import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface SearchableSelectOption {
  value: string | number
  label: string
  searchTerms?: string
}

interface SearchableSelectProps {
  label?: string
  error?: string
  placeholder?: string
  options: SearchableSelectOption[]
  value?: string | number
  onChange?: (value: string | number) => void
  name?: string
  disabled?: boolean
}

export default function SearchableSelect({
  label,
  error,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  name,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filtered = useMemo(() => {
    if (!query) return options
    const lower = query.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        opt.searchTerms?.toLowerCase().includes(lower),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query])

  const handleSelect = (val: string | number) => {
    onChange?.(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex].value)
        }
        break
      case 'Escape':
        setOpen(false)
        setQuery('')
        break
    }
  }

  const selectId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          name={name}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev)
              setTimeout(() => inputRef.current?.focus(), 0)
            }
          }}
          onKeyDown={handleKeyDown}
          className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 dark:bg-slate-800 dark:focus:border-primary-400 dark:focus:ring-primary-400 ${
            error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'
          } ${open ? 'border-primary-500 ring-1 ring-primary-500 dark:border-primary-400' : ''}`}
        >
          <span className={selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <div className="border-b border-slate-100 p-2 dark:border-slate-700">
              <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-700">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No results found</li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                      opt.value === value
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : highlightedIndex === i
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESSFUL (no TypeScript or lint errors)

- [ ] **Step 3: Commit**

```bash
cd frontend && git add src/components/ui/SearchableSelect.tsx && git commit -m "feat: add reusable SearchableSelect component"
```

---

### Task 2: Integrate SearchableSelect into TestCreate

**Files:**
- Modify: `frontend/src/pages/admin/TestCreate.tsx:221-233` (candidate Select replacement)
- Modify: `frontend/src/pages/admin/TestCreate.tsx:1-15` (add import)

**Interfaces:** Consumes `SearchableSelect` from Task 1 and `CandidateOption` interface already in `TestCreate.tsx`.

- [ ] **Step 1: Add SearchableSelect import**

In `TestCreate.tsx`, add after the existing `Select` import (line 11):

```typescript
import SearchableSelect from '@/components/ui/SearchableSelect'
```

- [ ] **Step 2: Replace candidate Select with SearchableSelect**

Replace lines 221-233 (the candidate `<Select>`) with:

```tsx
<SearchableSelect
  name="candidate_id"
  placeholder="Select existing candidate (optional)"
  value={selectedCandidateId}
  onChange={(val) => handleCandidateChange(String(val))}
  options={[
    { value: '', label: 'Enter manually' },
    ...(candidatesData ?? []).map((c) => ({
      value: c.id,
      label: c.name,
      searchTerms: c.cnic,
    })),
  ]}
/>
```

Key changes from old `<Select>`:
- `onChange` now receives value directly (not event) — wraps with `handleCandidateChange(String(val))`
- Options use `value: c.id` (number) with `searchTerms: c.cnic` for search
- `searchTerms` enables CNIC-based search alongside name search

- [ ] **Step 3: Run linter**

Run: `cd frontend && npm run lint`
Expected: No errors

- [ ] **Step 4: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: E2E browser verification**

1. Navigate to `http://localhost:5173/admin/tests/create`
2. Verify the candidate dropdown shows "Select existing candidate (optional)"
3. Click it — verify dropdown opens with search input
4. Type "Hanan" — verify it filters to show matching candidates
5. Clear the search, type the CNIC "37405" — verify it filters by CNIC
6. Select a candidate — verify name/CNIC fields auto-fill
7. Click X on the dropdown — verify selection clears and fields become editable again

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/pages/admin/TestCreate.tsx && git commit -m "feat: use SearchableSelect for candidate dropdown in Create Test"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Run full lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: Both pass with no errors

- [ ] **Step 2: Verify no regressions in other Selects**

Confirm that category Selects, status filters, profile Select, and other `<Select>` usages are unchanged and still work.
