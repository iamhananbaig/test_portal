import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { PenLine } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatDateTime } from '../../utils/dates'

interface Test {
  id: number
  test_id: string
  candidate_name: string
  candidate_cnic: string
  total_marks: number
  status: string
  created_at: string
  submitted_at: string | null
}

export default function Marking() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const refetch = useCallback(() => {
    let cancelled = false

    async function load() {
      const response = await api.get('/marking/pending', { params: { page } })
      if (!cancelled) {
        setTests(response.data.data)
        setTotalPages(response.data.meta.last_page)
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    return refetch()
  }, [refetch])

  return (
    <div>
      <PageHeader
        title="Marking Queue"
        description="Tests pending review with descriptive questions"
      />

      <Card className="mt-6">
        <CardContent>
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
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
          ) : tests.length === 0 ? (
            <EmptyState
              icon={PenLine}
              message="No tests pending review"
              description="All tests have been marked."
            />
          ) : (
            <>
              <Table
                columns={[
                  { key: 'candidate', header: 'Candidate' },
                  { key: 'test_id', header: 'Test ID' },
                  { key: 'marks', header: 'Total Marks' },
                  { key: 'submitted', header: 'Submitted' },
                  { key: 'status', header: 'Status' },
                  { key: 'action', header: '', className: 'text-right' },
                ]}
              >
                {tests.map((test) => (
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
                    <TableCell>{test.total_marks}</TableCell>
                    <TableCell>
                      {test.submitted_at ? formatDateTime(test.submitted_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={test.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => navigate(`/admin/marking/${test.id}`)}>
                        Mark
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
