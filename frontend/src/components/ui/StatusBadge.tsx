import Badge from './Badge'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  ready: 'info',
  expired: 'danger',
  in_progress: 'warning',
  submitted: 'warning',
  auto_submitted: 'warning',
  pending_review: 'warning',
  completed: 'success',
  active: 'success',
  inactive: 'gray',
}

function getStatusVariant(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'gray' {
  return statusVariant[status] || 'gray'
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {formatStatus(status)}
    </Badge>
  )
}
