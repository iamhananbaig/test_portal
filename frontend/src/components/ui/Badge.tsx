import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
  size?: 'sm' | 'md'
  outline?: boolean
  children: ReactNode
  className?: string
}

const variantClasses = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  info: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const outlineClasses = {
  success: 'border border-emerald-200 text-emerald-700 bg-transparent dark:border-emerald-700 dark:text-emerald-400',
  warning: 'border border-amber-200 text-amber-700 bg-transparent dark:border-amber-700 dark:text-amber-400',
  danger: 'border border-rose-200 text-rose-700 bg-transparent dark:border-rose-700 dark:text-rose-400',
  info: 'border border-primary-200 text-primary-700 bg-transparent dark:border-primary-700 dark:text-primary-400',
  gray: 'border border-slate-200 text-slate-600 bg-transparent dark:border-slate-600 dark:text-slate-300',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
}

export default function Badge({
  variant = 'gray',
  size = 'md',
  outline = false,
  children,
  className = '',
}: BadgeProps) {
  const classes = outline ? outlineClasses[variant] : variantClasses[variant]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${classes} ${className}`}
    >
      {children}
    </span>
  )
}
