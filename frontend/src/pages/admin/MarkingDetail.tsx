import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card, { CardContent, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/marking/${id}`)
      setTestInfo(response.data.test)
      setQuestions(response.data.questions)

      const initialMarks: Record<number, string> = {}
      response.data.questions.forEach((q: DescriptiveQuestion) => {
        initialMarks[q.question_id] = q.awarded_marks !== null ? String(q.awarded_marks) : ''
      })
      setMarks(initialMarks)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkChange = (questionId: number, value: string) => {
    setMarks((prev) => ({ ...prev, [questionId]: value }))
    setMessage(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const marksPayload = questions
        .filter((q) => marks[q.question_id] !== '')
        .map((q) => ({
          question_id: q.question_id,
          awarded_marks: parseFloat(marks[q.question_id]),
        }))

      if (marksPayload.length === 0) {
        setMessage({ type: 'error', text: 'Please enter marks for at least one question.' })
        return
      }

      await api.put(`/marking/${id}`, { marks: marksPayload })
      setMessage({ type: 'success', text: 'Marks saved successfully.' })
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save marks.' })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setMessage(null)
    try {
      await api.post(`/marking/${id}/finalize`)
      setMessage({ type: 'success', text: 'Test finalized successfully.' })
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to finalize.' })
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Loading...</p>
  }

  if (!testInfo) {
    return <p className="py-8 text-center text-gray-500">Test not found.</p>
  }

  const allMarked = questions.every((q) => marks[q.question_id] !== '')
  const isCompleted = testInfo.status === 'completed'

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marking: {testInfo.test_id}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {testInfo.candidate_name} — {testInfo.candidate_cnic}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/marking')}>
          Back to Queue
        </Button>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {questions.map((question) => (
          <Card key={question.question_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-500">Question {question.display_order}</span>
                  <span className="ml-2 text-sm text-gray-500">— {question.category}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Max: {question.max_marks} marks</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{question.text}</p>

              {question.descriptive_answer ? (
                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Candidate Answer:</p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-900">{question.descriptive_answer}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No answer submitted.</p>
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
          <Button variant="secondary" onClick={handleFinalize} disabled={finalizing || !allMarked}>
            {finalizing ? 'Finalizing...' : 'Finalize Test'}
          </Button>
        </div>
      )}
    </div>
  )
}
