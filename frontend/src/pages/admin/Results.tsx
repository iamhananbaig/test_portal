import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BarChart3 } from 'lucide-react'
import api from '../../services/api'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDateTime } from '../../utils/dates'

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

export default function Results() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const filters = {
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  }
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(filters.search, 300)

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      prev.delete('page')
      return prev
    })
    setPage(1)
  }

  const refetch = useCallback(() => {
    let cancelled = false

    async function load() {
      const params: Record<string, string | number> = { page }
      if (filters.status) params.status = filters.status
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/results', { params })
      if (!cancelled) {
        setResults(response.data.data)
        setTotalPages(response.data.meta.last_page)
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [page, filters.status, debouncedSearch])

  useEffect(() => {
    return refetch()
  }, [refetch])

  return (
    <div>
      <PageHeader title="Results" />

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending_review', label: 'Pending Review' },
              ]}
            />
            <div className="md:col-span-2">
              <Input
                label="Search"
                placeholder="Search by name, CNIC, or Test ID..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              message="No results found"
              description="Results will appear here once tests are submitted."
            />
          ) : (
            <>
              <Table
                columns={[
                  { key: 'candidate', header: 'Candidate' },
                  { key: 'test_id', header: 'Test ID' },
                  { key: 'score', header: 'Score' },
                  { key: 'submitted', header: 'Submitted' },
                  { key: 'status', header: 'Status' },
                  { key: 'actions', header: 'Actions', className: 'text-right' },
                ]}
              >
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{result.candidate_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{result.candidate_cnic}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {result.test_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {result.total_obtained !== null ? (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {result.total_obtained} / {result.total_marks}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.submitted_at ? formatDateTime(result.submitted_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={result.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/admin/results/${result.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => {
                setPage(p)
                setSearchParams((prev) => { prev.set('page', String(p)); return prev })
              }} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
