import { useState, useEffect } from 'react'
import { HelpCircle, FolderOpen, FileText, PenLine } from 'lucide-react'
import api from '../../services/api'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Skeleton from '../../components/ui/Skeleton'
import PageHeader from '../../components/ui/PageHeader'

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
  { key: 'total_questions', label: 'Total Questions', icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'total_categories', label: 'Categories', icon: FolderOpen, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'total_tests', label: 'Total Tests', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'pending_marking', label: 'Pending Marking', icon: PenLine, color: 'text-orange-600', bg: 'bg-orange-50' },
] as const

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <CardContent>
            <Skeleton className="h-6 w-32 mb-4" />
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
    return <p className="py-8 text-center text-gray-500">Failed to load stats.</p>
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key} hover>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${bg} p-2.5`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats[key]}
                    {key === 'total_questions' && (
                      <span className="ml-1 text-xs font-normal text-gray-500">
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
          <h2 className="text-lg font-semibold text-gray-900">Tests by Status</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.tests_by_status).map(([status, count]) => (
              <div key={status} className="flex flex-col items-center rounded-lg border border-gray-100 p-3 text-center">
                <StatusBadge status={status} />
                <span className="mt-2 text-xl font-bold text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
