import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { PenLine } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
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

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await api.get('/marking/pending', { params: { page } })
      setTests(response.data.data)
      setTotalPages(response.data.meta.last_page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [page])

  return (
    <div>
      <PageHeader title="Marking Queue" description="Tests pending review with descriptive questions" />

      <Card className="mt-6">
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
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
                      <p className="font-medium text-gray-900">{test.candidate_name}</p>
                      <p className="text-xs text-gray-500">{test.candidate_cnic}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-gray-900">{test.test_id}</span>
                    </TableCell>
                    <TableCell>{test.total_marks}</TableCell>
                    <TableCell>{test.submitted_at ? formatDateTime(test.submitted_at) : '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Pending Review
                      </span>
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
