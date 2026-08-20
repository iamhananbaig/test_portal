import { useState, useEffect } from 'react'
import api from '../../services/api'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

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

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  ready: 'info',
  expired: 'danger',
  in_progress: 'warning',
  pending_review: 'warning',
  completed: 'success',
}

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
    return <p className="py-8 text-center text-gray-500">Loading...</p>
  }

  if (!stats) {
    return <p className="py-8 text-center text-gray-500">Failed to load stats.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_questions}</p>
            <p className="text-xs text-gray-500">{stats.active_questions} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Categories</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_categories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Total Tests</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_tests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Pending Marking</p>
            <p className="mt-1 text-3xl font-bold text-orange-600">{stats.pending_marking}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Tests by Status</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.tests_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <Badge variant={statusVariant[status] || 'gray'}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <span className="text-lg font-semibold text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
