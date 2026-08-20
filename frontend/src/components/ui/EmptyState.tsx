import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-300" strokeWidth={1.5} />
      <h3 className="mt-3 text-sm font-medium text-slate-900">{message}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
