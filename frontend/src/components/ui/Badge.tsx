import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
  size?: 'sm' | 'md'
  outline?: boolean
  children: ReactNode
  className?: string
}

const variantClasses = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
}

const outlineClasses = {
  success: 'border border-green-300 text-green-700 bg-transparent',
  warning: 'border border-yellow-300 text-yellow-700 bg-transparent',
  danger: 'border border-red-300 text-red-700 bg-transparent',
  info: 'border border-blue-300 text-blue-700 bg-transparent',
  gray: 'border border-gray-300 text-gray-700 bg-transparent',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
}

export default function Badge({ variant = 'gray', size = 'md', outline = false, children, className = '' }: BadgeProps) {
  const classes = outline ? outlineClasses[variant] : variantClasses[variant]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${classes} ${className}`}
    >
      {children}
    </span>
  )
}
