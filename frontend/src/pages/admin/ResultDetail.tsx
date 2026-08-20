import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
    completed: 'success',
    pending_review: 'warning',
  }

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Loading...</p>
  }

  if (!testInfo) {
    return <p className="py-8 text-center text-gray-500">Result not found.</p>
  }

  const percentage = result && testInfo.total_marks > 0
    ? ((result.total_obtained / testInfo.total_marks) * 100).toFixed(1)
    : '0'

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Result: {testInfo.test_id}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {testInfo.candidate_name} — {testInfo.candidate_cnic}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/results')}>
          Back to Results
        </Button>
      </div>

      {/* Candidate Info + Score */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-500">Candidate Info</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{testInfo.candidate_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">CNIC</dt>
                <dd className="font-medium text-gray-900">{testInfo.candidate_cnic}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Duration</dt>
                <dd className="font-medium text-gray-900">{testInfo.duration_minutes} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge variant={statusVariant[testInfo.status] || 'gray'}>
                    {formatStatus(testInfo.status)}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-500">Timestamps</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(testInfo.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Started</dt>
                <dd className="font-medium text-gray-900">
                  {testInfo.started_at ? new Date(testInfo.started_at).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Submitted</dt>
                <dd className="font-medium text-gray-900">
                  {testInfo.submitted_at ? new Date(testInfo.submitted_at).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900">
                  {testInfo.submission_method ? formatStatus(testInfo.submission_method) : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-500">Score</h2>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {result.total_obtained}
                  <span className="text-lg font-normal text-gray-500"> / {testInfo.total_marks}</span>
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-600">{percentage}%</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-gray-600">MCQ: {result.mcq_marks}</p>
                  <p className="text-gray-600">Descriptive: {result.descriptive_marks}</p>
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">No result yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="rounded-lg border border-gray-100 p-4">
                  <p className="text-sm font-medium text-gray-500">{cat.category}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {cat.obtained_marks}
                    <span className="text-sm font-normal text-gray-500"> / {cat.total_marks}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.question_id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Q{question.display_order}
                      </span>
                      <Badge variant="gray">{question.category}</Badge>
                      <span className="text-xs text-gray-500">
                        {question.type === 'mcq' ? 'MCQ' : 'Descriptive'}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-900">{question.text}</p>

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
                                  ? 'bg-green-50 text-green-800'
                                  : isSelected && !isCorrect
                                    ? 'bg-red-50 text-red-800'
                                    : isCorrect
                                      ? 'bg-green-50 text-green-800'
                                      : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="font-medium">{option.label}.</span>
                              <span>{option.text}</span>
                              {isSelected && <span className="ml-auto text-xs font-medium">Selected</span>}
                              {isCorrect && <span className="ml-auto text-xs font-medium">Correct</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {question.type === 'descriptive' && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-700">Answer:</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-900">
                          {question.descriptive_answer || 'No answer submitted'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-gray-500">Marks</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {question.awarded_marks !== null ? question.awarded_marks : '—'}
                      <span className="text-sm font-normal text-gray-500"> / {question.marks}</span>
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
