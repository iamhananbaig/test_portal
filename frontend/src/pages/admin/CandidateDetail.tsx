import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Mail, Phone, CreditCard } from 'lucide-react'
import api from '@/services/api'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Table, { TableRow, TableCell } from '@/components/ui/Table'
import Skeleton from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/dates'

interface TestResult {
  id: number
  test_id: string
  status: string
  total_marks: number
  obtained_marks: number | null
  mcq_marks: number | null
  descriptive_marks: number | null
  created_at: string
}

interface CandidateData {
  id: number
  name: string
  cnic: string
  email: string | null
  phone: string | null
  cv_path: string | null
  tests: TestResult[]
  total_tests: number
  average_score: number | null
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await api.get(`/candidates/${id}`)
      return response.data.data as CandidateData
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!candidate) return null

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/candidates')}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={candidate.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>Candidate Info</CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {candidate.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{candidate.name}</p>
                <p className="font-mono text-sm text-slate-500">{candidate.cnic}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
              {candidate.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <span className="font-mono">{candidate.cnic}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{candidate.total_tests}</p>
                  <p className="text-xs text-slate-500">Total Tests</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {candidate.average_score !== null ? `${candidate.average_score}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Avg Score</p>
                </div>
              </div>
            </div>

            {candidate.cv_path && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <a
                  href={`/api/candidates/${candidate.id}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <Download className="h-4 w-4" />
                  Download CV
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>Test History</CardHeader>
          <CardContent>
            {candidate.tests.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No tests taken yet.
              </div>
            ) : (
              <Table
                columns={[
                  { key: 'test_id', header: 'Test ID' },
                  { key: 'status', header: 'Status' },
                  { key: 'marks', header: 'Marks' },
                  { key: 'date', header: 'Date' },
                ]}
              >
                {candidate.tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <a
                        href={`/admin/results/${test.id}`}
                        className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {test.test_id}
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={test.status} />
                    </TableCell>
                    <TableCell>
                      {test.obtained_marks !== null ? (
                        <span className="font-medium">
                          {test.obtained_marks}
                          <span className="text-slate-400"> / {test.total_marks}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(test.created_at)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
