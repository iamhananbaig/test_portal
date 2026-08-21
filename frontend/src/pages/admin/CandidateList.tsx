import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Trash2, Eye } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import Table, { TableRow, TableCell } from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { useToast } from '@/context/useToast'
import { useDebounce } from '@/hooks/useDebounce'
import { getErrorMessage } from '@/lib/errors'

interface Candidate {
  id: number
  name: string
  cnic: string
  email: string | null
  phone: string | null
  cv_path: string | null
  tests_count: number
}

export default function CandidateList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', page, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page }
      if (debouncedSearch) params.search = debouncedSearch
      const response = await api.get('/candidates', { params })
      return { data: response.data.data, totalPages: response.data.meta.last_page }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      success('Candidate deleted.')
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const candidates = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Manage candidate profiles and CVs."
        action={
          <Button onClick={() => navigate('/admin/candidates/new')} icon={<Plus className="h-4 w-4" />}>
            Add Candidate
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by name, CNIC, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={Users}
              message="No candidates"
              description="Add candidates to track their test history."
              action={
                <Button onClick={() => navigate('/admin/candidates/new')} size="sm">
                  Add Candidate
                </Button>
              }
            />
          ) : (
            <>
              <Table
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'cnic', header: 'CNIC' },
                  { key: 'contact', header: 'Contact' },
                  { key: 'tests', header: 'Tests' },
                  { key: 'actions', header: '' },
                ]}
              >
                {candidates.map((c: Candidate) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{c.cnic}</span>
                    </TableCell>
                    <TableCell>
                      {c.email && <p className="text-sm">{c.email}</p>}
                      {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                      {!c.email && !c.phone && <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{c.tests_count}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/candidates/${c.id}`)}
                          icon={<Eye className="h-4 w-4" />}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/candidates/${c.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this candidate?')) {
                              deleteMutation.mutate(c.id)
                            }
                          }}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
