import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { FileText, Plus } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
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

export default function TestList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  }
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
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

  const { data, isLoading } = useQuery({
    queryKey: ['tests', page, filters.status, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page }
      if (filters.status) params.status = filters.status
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/tests', { params })
      return { data: response.data.data, totalPages: response.data.meta.last_page }
    },
  })

  const tests = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Tests"
        action={
          <Button onClick={() => navigate('/admin/tests/new')} icon={<Plus className="h-4 w-4" />}>
            Create Test
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
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
            <div className="md:col-span-2">
              <Input
                label="Search"
                placeholder="Search by name, CNIC, or Test ID..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <EmptyState
              icon={FileText}
              message="No tests found"
              description="Create your first test to get started."
              action={
                <Button onClick={() => navigate('/admin/tests/new')} size="sm">
                  Create Test
                </Button>
              }
            />
          ) : (
            <>
              <Table
                columns={[
                  { key: 'candidate', header: 'Candidate' },
                  { key: 'test_id', header: 'Test ID' },
                  { key: 'created', header: 'Created' },
                  { key: 'expires', header: 'Valid Until' },
                  { key: 'status', header: 'Status' },
                ]}
              >
                {tests.map((test: Test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{test.candidate_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{test.candidate_cnic}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {test.test_id}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(test.created_at)}</TableCell>
                    <TableCell>{test.expires_at ? formatDateTime(test.expires_at) : '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={test.status} />
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
