import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Mail, Phone, CreditCard, Save } from 'lucide-react'
import api from '@/services/api'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Table, { TableRow, TableCell } from '@/components/ui/Table'
import Skeleton from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/useToast'
import { getErrorMessage } from '@/lib/errors'
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
  excel_score: number | null
  excel_remarks: string | null
  tests: TestResult[]
  total_tests: number
  average_score: number | null
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { error: toastError } = useToast()
  const [editingExcel, setEditingExcel] = useState(false)
  const [excelScore, setExcelScore] = useState<string>('')
  const [excelRemarks, setExcelRemarks] = useState('')

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await api.get(`/candidates/${id}`)
      return response.data.data as CandidateData
    },
  })

  const updateExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/candidates/${id}/excel-score`, {
        excel_score: excelScore === '' ? null : parseFloat(excelScore),
        excel_remarks: excelRemarks || null,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      setEditingExcel(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
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
                <button
                  onClick={async () => {
                    const response = await api.get(`/candidates/${candidate.id}/cv`, { responseType: 'blob' })
                    const url = window.URL.createObjectURL(new Blob([response.data]))
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', candidate.cv_path!.split('/').pop() || 'cv')
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <Download className="h-4 w-4" />
                  Download CV
                </button>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Excel Evaluation</p>
                {!editingExcel && (
                  <button
                    onClick={() => {
                      setExcelScore(candidate.excel_score?.toString() ?? '')
                      setExcelRemarks(candidate.excel_remarks ?? '')
                      setEditingExcel(true)
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {candidate.excel_score !== null ? 'Edit' : 'Add Score'}
                  </button>
                )}
              </div>
              {editingExcel ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Score (out of 20)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={excelScore}
                      onChange={(e) => setExcelScore(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="0 - 20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Remarks</label>
                    <textarea
                      value={excelRemarks}
                      onChange={(e) => setExcelRemarks(e.target.value)}
                      rows={5}
                      maxLength={1000}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Enter evaluation remarks..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateExcelMutation.mutate()}
                      loading={updateExcelMutation.isPending}
                      icon={<Save className="h-3.5 w-3.5" />}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingExcel(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {candidate.excel_score !== null ? `${candidate.excel_score} / 20` : '—'}
                  </p>
                  {candidate.excel_remarks && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">{candidate.excel_remarks}</p>
                  )}
                </div>
              )}
            </div>
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
