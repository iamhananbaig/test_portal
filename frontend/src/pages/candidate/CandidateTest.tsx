import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Flag, AlertTriangle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

interface QuestionOption {
  id: number
  label: string
  text: string
  image_path: string | null
}

interface Question {
  id: number
  text: string
  image_path: string | null
  type: 'mcq' | 'descriptive'
  marks: number
  category: string
  category_id: number
  display_order: number
  options: QuestionOption[]
  selected_option_id: number | null
  descriptive_answer: string | null
  is_flagged: boolean
}

interface TestData {
  questions: Question[]
  remaining_seconds: number
  candidate_name: string
  test_id: string
}

export default function CandidateTest() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()

  const [data, setData] = useState<TestData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastAnswerRef = useRef<{ questionId: number; selectedOptionId: number | null; descriptiveAnswer: string | null } | null>(null)

  const loadQuestions = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/candidate/${testId}/questions`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json()
        if (res.status === 408) {
          navigate(`/candidate/${testId}/complete`)
          return
        }
        setError(body.message || 'Failed to load questions')
        return
      }

      const body: TestData = await res.json()
      setData(body)
      setRemainingSeconds(body.remaining_seconds)

      const savedIndex = localStorage.getItem(`test_${testId}_index`)
      if (savedIndex !== null) {
        const idx = parseInt(savedIndex, 10)
        if (idx >= 0 && idx < body.questions.length) {
          setCurrentIndex(idx)
        }
      }
    } catch {
      setError('Network error loading questions')
    } finally {
      setLoading(false)
    }
  }, [testId, navigate])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  useEffect(() => {
    if (loading || !data) return
    if (remainingSeconds > 0) return

    const submitOnExpiry = async () => {
      try {
        await fetch(`/api/candidate/${testId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        })
      } catch { /* server may have already auto-submitted */ }
      navigate(`/candidate/${testId}/complete`)
    }
    submitOnExpiry()
  }, [remainingSeconds, loading, data, testId, navigate])

  useEffect(() => {
    if (loading || !data || remainingSeconds <= 0) return

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [loading, data, remainingSeconds > 0])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const saveAnswer = useCallback(async (questionId: number, selectedOptionId: number | null, descriptiveAnswer: string | null) => {
    setSaveStatus('saving')
    const controller = new AbortController()
    try {
      const res = await fetch(`/api/candidate/${testId}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          selected_option_id: selectedOptionId,
          descriptive_answer: descriptiveAnswer,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 408) {
          navigate(`/candidate/${testId}/complete`)
          return
        }
        setSaveStatus('unsaved')
        return
      }

      setSaveStatus('saved')
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId
              ? { ...q, selected_option_id: selectedOptionId, descriptive_answer: descriptiveAnswer }
              : q
          ),
        }
      })
    } catch {
      setSaveStatus('unsaved')
    }
  }, [testId, navigate])

  const handleAnswerChange = useCallback((questionId: number, selectedOptionId: number | null, descriptiveAnswer: string | null) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? { ...q, selected_option_id: selectedOptionId, descriptive_answer: descriptiveAnswer }
            : q
        ),
      }
    })

    setSaveStatus('unsaved')

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveAnswer(questionId, selectedOptionId, descriptiveAnswer)
    }, 1000)

    lastAnswerRef.current = { questionId, selectedOptionId, descriptiveAnswer }
  }, [saveAnswer])

  const handleFlag = async (questionId: number) => {
    try {
      const res = await fetch(`/api/candidate/${testId}/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      })

      if (res.ok) {
        const body = await res.json()
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId ? { ...q, is_flagged: body.is_flagged } : q
            ),
          }
        })
      }
    } catch {
      // silent
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }

      if (lastAnswerRef.current) {
        const { questionId, selectedOptionId, descriptiveAnswer } = lastAnswerRef.current
        await saveAnswer(questionId, selectedOptionId, descriptiveAnswer)
      }

      const res = await fetch(`/api/candidate/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })

      if (res.ok) {
        localStorage.removeItem(`test_${testId}_index`)
        navigate(`/candidate/${testId}/complete`)
      } else {
        const body = await res.json()
        setError(body.message || 'Failed to submit')
      }
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
      setShowSubmitConfirm(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    localStorage.setItem(`test_${testId}_index`, index.toString())
  }

  const currentQuestion = data?.questions[currentIndex]
  const answeredCount = data?.questions.filter((q) => q.selected_option_id || q.descriptive_answer).length ?? 0
  const flaggedCount = data?.questions.filter((q) => q.is_flagged).length ?? 0
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  if (!data || !currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900">{data.candidate_name}</span>
          <span className="text-sm text-gray-500 font-mono">{data.test_id}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            Time: {formatTime(remainingSeconds)}
          </div>

          <div className="flex items-center gap-1">
            {saveStatus === 'saving' && <span className="text-xs text-gray-400">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-xs text-green-600">Saved</span>}
            {saveStatus === 'unsaved' && <span className="text-xs text-amber-500">Unsaved</span>}
          </div>

          <Button variant="danger" size="sm" onClick={() => setShowSubmitConfirm(true)}>
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 p-4 hidden md:block">
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Questions ({answeredCount}/{data.questions.length} answered, {flaggedCount} flagged)
            </div>
          </div>

          <div className="space-y-1">
            {data.questions.map((q, i) => {
              const isAnswered = !!(q.selected_option_id || q.descriptive_answer)
              const isCurrent = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isAnswered
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                    isCurrent ? 'bg-white/20' : 'bg-gray-200/60'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="truncate flex-1 text-left">
                    {q.text.substring(0, 50)}{q.text.length > 50 ? '...' : ''}
                  </span>
                  {q.is_flagged && (
                    <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
              Answered
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-gray-50 border border-gray-300"></span>
              Unanswered
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Flag className="h-3.5 w-3.5 text-amber-500" />
              Flagged
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {currentQuestion.category}
                </span>
                <span className="text-sm text-gray-500">
                  Question {currentIndex + 1} of {data.questions.length}
                </span>
                <span className="text-sm text-gray-400">
                  ({currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'})
                </span>
              </div>

              <button
                onClick={() => handleFlag(currentQuestion.id)}
                className={`p-2 rounded-lg transition-all duration-150 ${currentQuestion.is_flagged ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                title={currentQuestion.is_flagged ? 'Remove flag' : 'Flag for review'}
              >
                <Flag className={`h-5 w-5 ${currentQuestion.is_flagged ? 'fill-amber-500' : ''}`} />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                {currentQuestion.text}
              </p>
              {currentQuestion.image_path && (
                <img
                  src={`/storage/${currentQuestion.image_path}`}
                  alt="Question"
                  className="mt-4 max-w-full rounded-lg border border-gray-200"
                />
              )}
            </div>

            {currentQuestion.type === 'mcq' ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                      currentQuestion.selected_option_id === option.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion.id}`}
                      checked={currentQuestion.selected_option_id === option.id}
                      onChange={() => handleAnswerChange(currentQuestion.id, option.id, null)}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 mr-2">{option.label}.</span>
                      <span className="text-gray-900">{option.text}</span>
                    </div>
                    {option.image_path && (
                      <img src={`/storage/${option.image_path}`} alt={`Option ${option.label}`} className="max-h-20 rounded" />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <textarea
                  value={currentQuestion.descriptive_answer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, null, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={8}
                  className="w-full border-0 focus:ring-0 resize-y text-gray-900 placeholder:text-gray-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pb-8">
              <Button
                variant="secondary"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              <div className="md:hidden">
                <select
                  value={currentIndex}
                  onChange={(e) => goToQuestion(parseInt(e.target.value, 10))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {data.questions.map((q, i) => (
                    <option key={q.id} value={i}>
                      Q{i + 1} {q.is_flagged ? '(flagged)' : ''} {q.selected_option_id || q.descriptive_answer ? '(answered)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => {
                  if (currentIndex < data.questions.length - 1) {
                    goToQuestion(currentIndex + 1)
                  }
                }}
                disabled={currentIndex === data.questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={showSubmitConfirm}
        onClose={() => !submitting && setShowSubmitConfirm(false)}
        title="Submit Test?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} className="flex-1" loading={submitting}>
              Submit
            </Button>
          </>
        }
      >
        <p className="text-gray-600 mb-2">
          You have answered {answeredCount} of {data.questions.length} questions.
          {flaggedCount > 0 && ` ${flaggedCount} questions are flagged for review.`}
        </p>
        <p className="text-sm text-gray-500">
          Once submitted, you cannot go back to change your answers.
        </p>
      </Modal>
    </div>
  )
}
