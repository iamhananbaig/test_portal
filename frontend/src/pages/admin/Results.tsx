import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import api from '../../services/api'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import { useDebounce } from '../../hooks/useDebounce'

interface Result {
  id: number
  test_id: string
  candidate_name: string
  candidate_cnic: string
  total_marks: number
  status: string
  created_at: string
  submitted_at: string | null
  mcq_marks: number | null
  descriptive_marks: number | null
  total_obtained: number | null
  is_finalized: boolean
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  completed: 'success',
  pending_review: 'warning',
}

export default function Results() {
  const navigate = useNavigate()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(filters.search, 300)

  const fetchResults = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (filters.status) params.status = filters.status
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/results', { params })
      setResults(response.data.data)
      setTotalPages(response.data.meta.last_page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [filters.status, debouncedSearch, page])

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Results</h1>

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
              options={[
                { value: '', label: 'All' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending_review', label: 'Pending Review' },
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
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No results found.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="pb-3 font-medium">Candidate</th>
                    <th className="pb-3 font-medium">Test ID</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Submitted</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{result.candidate_name}</p>
                        <p className="text-xs text-gray-500">{result.candidate_cnic}</p>
                      </td>
                      <td className="py-3 font-mono text-sm font-semibold text-gray-900">{result.test_id}</td>
                      <td className="py-3 text-gray-900">
                        {result.total_obtained !== null ? (
                          <span className="font-semibold">
                            {result.total_obtained} / {result.total_marks}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">
                        {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant[result.status] || 'gray'}>
                          {formatStatus(result.status)}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/admin/results/${result.id}`)}
                        >
                          View
                        </Button>
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
