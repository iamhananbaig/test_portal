import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import Toast from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'

interface TestInfo {
  id: number
  test_id: string
  candidate_name: string
  candidate_cnic: string
  total_marks: number
  status: string
}

interface DescriptiveQuestion {
  question_id: number
  text: string
  max_marks: number
  category: string
  display_order: number
  descriptive_answer: string | null
  awarded_marks: number | null
}

export default function MarkingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [questions, setQuestions] = useState<DescriptiveQuestion[]>([])
  const [marks, setMarks] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const refetch = useCallback(() => {
    let cancelled = false

    async function load() {
      const response = await api.get(`/marking/${id}`)
      if (!cancelled) {
        setTestInfo(response.data.test)
        setQuestions(response.data.questions)

        const initialMarks: Record<number, string> = {}
        response.data.questions.forEach((q: DescriptiveQuestion) => {
          initialMarks[q.question_id] = q.awarded_marks !== null ? String(q.awarded_marks) : ''
        })
        setMarks(initialMarks)
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    return refetch()
  }, [refetch])

  const handleMarkChange = (questionId: number, value: string) => {
    setMarks((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const marksPayload = questions
        .filter((q) => marks[q.question_id] !== '')
        .map((q) => {
          const parsed = parseFloat(marks[q.question_id])
          return {
            question_id: q.question_id,
            awarded_marks: isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), q.max_marks),
          }
        })

      if (marksPayload.length === 0) {
        setToast({ message: 'Please enter marks for at least one question.', type: 'error' })
        return
      }

      await api.put(`/marking/${id}`, { marks: marksPayload })
      setToast({ message: 'Marks saved successfully.', type: 'success' })
      refetch()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setToast({
        message: error.response?.data?.message || 'Failed to save marks.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    if (
      !window.confirm(
        'Are you sure? This action cannot be undone. All marks will be finalized.',
      )
    )
      return

    setFinalizing(true)
    try {
      await api.post(`/marking/${id}/finalize`)
      setToast({ message: 'Test finalized successfully.', type: 'success' })
      refetch()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setToast({
        message: error.response?.data?.message || 'Failed to finalize.',
        type: 'error',
      })
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner />
      </div>
    )
  }

  if (!testInfo) {
    return <p className="py-8 text-center text-slate-500 dark:text-slate-400">Test not found.</p>
  }

  const allMarked = questions.every((q) => marks[q.question_id] !== '')
  const isCompleted = testInfo.status === 'completed'

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Marking: ${testInfo.test_id}`}
        description={`${testInfo.candidate_name} — ${testInfo.candidate_cnic}`}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/marking')}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Queue
          </Button>
        }
      />

      <div className="mt-6 space-y-4">
        {questions.map((question) => (
          <Card key={question.question_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Question {question.display_order}
                  </span>
                  <span className="ml-2 text-sm text-slate-400 dark:text-slate-500">— {question.category}</span>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Max: {question.max_marks} marks
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-900 dark:text-slate-100">{question.text}</p>

              {question.descriptive_answer ? (
                <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Candidate Answer:</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-slate-100">
                    {question.descriptive_answer}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No answer submitted.</p>
              )}

              <div className="mt-4">
                <Input
                  label="Awarded Marks"
                  type="number"
                  min="0"
                  max={question.max_marks}
                  step="0.5"
                  value={marks[question.question_id] || ''}
                  onChange={(e) => handleMarkChange(question.question_id, e.target.value)}
                  disabled={isCompleted}
                  placeholder={`0 - ${question.max_marks}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isCompleted && (
        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} loading={saving}>
            Save Marks
          </Button>
          <Button
            variant="secondary"
            onClick={handleFinalize}
            loading={finalizing}
            disabled={!allMarked}
          >
            Finalize Test
          </Button>
        </div>
      )}
    </div>
  )
}
