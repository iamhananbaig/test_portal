import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Card, { CardContent } from '../../components/ui/Card'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDateTime } from '../../utils/dates'

interface Test {
  id: number
  test_id: string
  candidate_name: string
  candidate_cnic: string
  duration_minutes: number
  total_marks: number
  status: string
  created_at: string
  expires_at: string | null
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  ready: 'info',
  expired: 'danger',
  in_progress: 'warning',
  submitted: 'warning',
  auto_submitted: 'warning',
  pending_review: 'warning',
  completed: 'success',
}

export default function TestList() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(filters.search, 300)

  const fetchTests = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (filters.status) params.status = filters.status
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/tests', { params })
      setTests(response.data.data)
      setTotalPages(response.data.meta.last_page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [filters.status, debouncedSearch, page])

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
        <Button onClick={() => navigate('/admin/tests/new')}>Create Test</Button>
      </div>

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
              options={[
                { value: '', label: 'All' },
                { value: 'ready', label: 'Ready' },
                { value: 'expired', label: 'Expired' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'pending_review', label: 'Pending Review' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
            <div className="col-span-2">
              <Input
                label="Search"
                placeholder="Search by name, CNIC, or Test ID..."
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }}
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading...</p>
          ) : tests.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No tests found.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="pb-3 font-medium">Candidate</th>
                    <th className="pb-3 font-medium">Test ID</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Valid Until</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{test.candidate_name}</p>
                        <p className="text-xs text-gray-500">{test.candidate_cnic}</p>
                      </td>
                      <td className="py-3 font-mono text-sm font-semibold text-gray-900">{test.test_id}</td>
                      <td className="py-3 text-gray-600">
                        {formatDateTime(test.created_at)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {test.expires_at ? formatDateTime(test.expires_at) : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant[test.status] || 'gray'}>
                          {formatStatus(test.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
