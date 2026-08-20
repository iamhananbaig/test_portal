import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import { formatDateTime } from '../../utils/dates'

interface TestInfo {
  id: number
  test_id: string
  candidate_name: string
  candidate_cnic: string
  duration_minutes: number
  total_marks: number
  status: string
  created_at: string
  started_at: string | null
  submitted_at: string | null
  submission_method: string | null
}

interface ResultInfo {
  mcq_marks: number
  descriptive_marks: number
  total_obtained: number
  is_finalized: boolean
}

interface CategoryBreakdown {
  category: string
  total_marks: number
  obtained_marks: number
}

interface QuestionOption {
  id: number
  label: string
  text: string
  is_correct: boolean
}

interface Question {
  question_id: number
  text: string
  type: string
  marks: number
  category: string
  display_order: number
  options: QuestionOption[]
  selected_option_id: number | null
  descriptive_answer: string | null
  awarded_marks: number | null
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function ResultDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/results/${id}`)
        setTestInfo(response.data.test)
        setResult(response.data.result)
        setCategoryBreakdown(response.data.category_breakdown)
        setQuestions(response.data.questions)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner />
      </div>
    )
  }

  if (!testInfo) {
    return <p className="py-8 text-center text-slate-500">Result not found.</p>
  }

  const percentage =
    result && testInfo.total_marks > 0
      ? ((result.total_obtained / testInfo.total_marks) * 100).toFixed(1)
      : '0'

  return (
    <div>
      <PageHeader
        title={`Result: ${testInfo.test_id}`}
        description={`${testInfo.candidate_name} — ${testInfo.candidate_cnic}`}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/results')}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Results
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Candidate Info
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{testInfo.candidate_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">CNIC</dt>
                <dd className="font-medium text-slate-900">{testInfo.candidate_cnic}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-medium text-slate-900">{testInfo.duration_minutes} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusBadge status={testInfo.status} />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Timestamps
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-900">
                  {formatDateTime(testInfo.created_at)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Started</dt>
                <dd className="font-medium text-slate-900">
                  {testInfo.started_at ? formatDateTime(testInfo.started_at) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Submitted</dt>
                <dd className="font-medium text-slate-900">
                  {testInfo.submitted_at ? formatDateTime(testInfo.submitted_at) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Method</dt>
                <dd className="font-medium text-slate-900">
                  {testInfo.submission_method
                    ? formatStatusLabel(testInfo.submission_method)
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Score
            </h2>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {result.total_obtained}
                  <span className="text-base font-normal text-slate-400">
                    {' '}
                    / {testInfo.total_marks}
                  </span>
                </p>
                <p className="mt-1 text-xl font-semibold text-primary-600">{percentage}%</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-slate-500">MCQ: {result.mcq_marks}</p>
                  <p className="text-slate-500">Descriptive: {result.descriptive_marks}</p>
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-slate-500">No result yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {categoryBreakdown.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Category Breakdown</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="rounded-lg border border-slate-100 p-4">
                  <p className="text-sm font-medium text-slate-500">{cat.category}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {cat.obtained_marks}
                    <span className="text-sm font-normal text-slate-400"> / {cat.total_marks}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Questions ({questions.length})</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.question_id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">
                        Q{question.display_order}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {question.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {question.type === 'mcq' ? 'MCQ' : 'Descriptive'}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-900">{question.text}</p>

                    {question.type === 'mcq' && question.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => {
                          const isSelected = option.id === question.selected_option_id
                          const isCorrect = option.is_correct
                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                isSelected && isCorrect
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : isSelected && !isCorrect
                                    ? 'bg-rose-50 text-rose-800'
                                    : isCorrect
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="font-medium">{option.label}.</span>
                              <span>{option.text}</span>
                              {isSelected && (
                                <span className="ml-auto text-xs font-medium">Selected</span>
                              )}
                              {isCorrect && (
                                <span className="ml-auto text-xs font-medium">Correct</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {question.type === 'descriptive' && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-medium text-slate-600">Answer:</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-900">
                          {question.descriptive_answer || 'No answer submitted'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-slate-400">Marks</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {question.awarded_marks !== null ? question.awarded_marks : '—'}
                      <span className="text-sm font-normal text-slate-400"> / {question.marks}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
