import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
  size?: 'sm' | 'md'
  outline?: boolean
  children: ReactNode
  className?: string
}

const variantClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-primary-50 text-primary-700',
  gray: 'bg-slate-100 text-slate-600',
}

const outlineClasses = {
  success: 'border border-emerald-200 text-emerald-700 bg-transparent',
  warning: 'border border-amber-200 text-amber-700 bg-transparent',
  danger: 'border border-rose-200 text-rose-700 bg-transparent',
  info: 'border border-primary-200 text-primary-700 bg-transparent',
  gray: 'border border-slate-200 text-slate-600 bg-transparent',
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
