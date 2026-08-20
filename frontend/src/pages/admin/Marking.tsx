import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
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
      <h1 className="text-2xl font-bold text-gray-900">Marking Queue</h1>
      <p className="mt-1 text-sm text-gray-500">Tests pending review with descriptive questions</p>

      <Card className="mt-6">
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading...</p>
          ) : tests.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No tests pending review.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="pb-3 font-medium">Candidate</th>
                    <th className="pb-3 font-medium">Test ID</th>
                    <th className="pb-3 font-medium">Total Marks</th>
                    <th className="pb-3 font-medium">Submitted</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
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
                      <td className="py-3 text-gray-600">{test.total_marks}</td>
                      <td className="py-3 text-gray-600">
                        {test.submitted_at ? formatDateTime(test.submitted_at) : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant="warning">Pending Review</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button size="sm" onClick={() => navigate(`/admin/marking/${test.id}`)}>
                          Mark
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
