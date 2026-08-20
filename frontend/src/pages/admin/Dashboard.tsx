import { useQuery } from '@tanstack/react-query'
import { HelpCircle, FolderOpen, FileText, PenLine } from 'lucide-react'
import api from '@/services/api'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'

interface DashboardStats {
  total_questions: number
  active_questions: number
  total_categories: number
  total_tests: number
  pending_marking: number
  tests_by_status: {
    ready: number
    in_progress: number
    pending_review: number
    completed: number
    expired: number
    submitted: number
  }
}

const statCards = [
  { key: 'total_questions', label: 'Total Questions', icon: HelpCircle, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { key: 'total_categories', label: 'Categories', icon: FolderOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'total_tests', label: 'Total Tests', icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { key: 'pending_marking', label: 'Pending Marking', icon: PenLine, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
] as const

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <CardContent>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return <p className="py-8 text-center text-slate-500 dark:text-slate-400">Failed to load stats.</p>
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key} hover>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${bg} p-2`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {stats[key]}
                    {key === 'total_questions' && (
                      <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
                        ({stats.active_questions} active)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tests by Status</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.tests_by_status).map(([status, count]) => (
              <div
                key={status}
                className="flex flex-col items-center rounded-lg border border-slate-100 dark:border-slate-700 p-3 text-center"
              >
                <StatusBadge status={status} />
                <span className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {count as number}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
