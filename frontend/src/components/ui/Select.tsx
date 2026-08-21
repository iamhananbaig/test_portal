import { type ChangeEvent, type SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  value,
  onChange,
  disabled,
  name,
  ...rest
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        disabled={disabled}
        value={value ?? ''}
        onChange={onChange}
        className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:border-primary-400 dark:focus:ring-primary-400 ${
          error ? 'border-rose-500' : ''
        } ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
}
