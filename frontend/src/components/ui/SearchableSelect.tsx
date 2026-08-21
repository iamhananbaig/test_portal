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
                  onChange={(e) => {
                    const newQuery = e.target.value
                    setQuery(newQuery)
                    const lower = newQuery.toLowerCase()
                    const firstMatch = options.findIndex(
                      (opt) =>
                        opt.label.toLowerCase().includes(lower) ||
                        opt.searchTerms?.toLowerCase().includes(lower),
                    )
                    setHighlightedIndex(firstMatch >= 0 ? firstMatch : -1)
                  }}
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
