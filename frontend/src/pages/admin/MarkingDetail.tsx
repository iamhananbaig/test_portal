import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
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

interface MarkingFormData {
  marks: Record<string, string>
}

export default function MarkingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [questions, setQuestions] = useState<DescriptiveQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MarkingFormData>({
    defaultValues: { marks: {} },
  })

  const marksValues = watch('marks')

  useEffect(() => {
    let cancelled = false

    async function load() {
      const response = await api.get(`/marking/${id}`)
      if (!cancelled) {
        setTestInfo(response.data.test)
        setQuestions(response.data.questions)

        const initialMarks: Record<string, string> = {}
        response.data.questions.forEach((q: DescriptiveQuestion) => {
          initialMarks[q.question_id] = q.awarded_marks !== null ? String(q.awarded_marks) : ''
        })
        reset({ marks: initialMarks })
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [id, reset])

  const onSave = async (data: MarkingFormData) => {
    setSaving(true)
    try {
      const marksPayload = questions
        .filter((q) => data.marks[q.question_id] !== '' && data.marks[q.question_id] !== undefined)
        .map((q) => {
          const parsed = parseFloat(data.marks[q.question_id])
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
      <div className="py-12 px-6 space-y-4">
        <Skeleton className="h-8 w-64 mb-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!testInfo) {
    return <p className="py-8 text-center text-slate-500 dark:text-slate-400">Test not found.</p>
  }

  const allMarked = questions.every((q) => marksValues[q.question_id] !== '' && marksValues[q.question_id] !== undefined)
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
                  {...register(`marks.${question.question_id}`)}
                  error={errors.marks?.[question.question_id]?.message}
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
          <Button onClick={handleSubmit(onSave)} loading={saving}>
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
