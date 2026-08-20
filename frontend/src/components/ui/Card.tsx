import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 ${hover ? 'transition-shadow hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`border-b border-slate-100 dark:border-slate-700 px-6 py-4 ${className}`}>{children}</div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`border-t border-slate-100 dark:border-slate-700 px-6 py-4 ${className}`}>{children}</div>
  )
}
