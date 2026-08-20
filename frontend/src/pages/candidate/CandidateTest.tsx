import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Flag, AlertTriangle, Sun, Moon, Menu, X } from 'lucide-react'
import { candidateApi } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'

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
  const { theme, toggle } = useTheme()

  const [data, setData] = useState<TestData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastAnswerRef = useRef<{
    questionId: number
    selectedOptionId: number | null
    descriptiveAnswer: string | null
  } | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false

    async function load() {
      try {
        const res = await candidateApi.get(`/candidate/${testId}/questions`, {
          signal: controller.signal,
        })

        if (!cancelled) {
          setData(res.data)
          setRemainingSeconds(res.data.remaining_seconds)

          const savedIndex = localStorage.getItem(`test_${testId}_index`)
          if (savedIndex !== null) {
            const idx = parseInt(savedIndex, 10)
            if (idx >= 0 && idx < res.data.questions.length) {
              setCurrentIndex(idx)
            }
          }
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
          if (axiosErr.response?.status === 408) {
            navigate(`/candidate/${testId}/complete`)
            return
          }
          if (!cancelled) setError(axiosErr.response?.data?.message || 'Failed to load questions')
        } else {
          if (!cancelled) setError('Network error loading questions')
        }
      }
      if (!cancelled) setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [testId, navigate])

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
        await candidateApi.post(`/candidate/${testId}/submit`)
      } catch {
        /* server may have already auto-submitted */
      }
      navigate(`/candidate/${testId}/complete`)
    }
    submitOnExpiry()
  }, [remainingSeconds, loading, data, testId, navigate])

  const isActive = remainingSeconds > 0

  useEffect(() => {
    if (loading || !data || !isActive) return

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
  }, [loading, data, isActive])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const saveAnswer = useCallback(
    async (questionId: number, selectedOptionId: number | null, descriptiveAnswer: string | null) => {
      setSaveStatus('saving')
      try {
        await candidateApi.put(`/candidate/${testId}/answer`, {
          question_id: questionId,
          selected_option_id: selectedOptionId,
          descriptive_answer: descriptiveAnswer,
        })

        setSaveStatus('saved')
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId
                ? { ...q, selected_option_id: selectedOptionId, descriptive_answer: descriptiveAnswer }
                : q,
            ),
          }
        })
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } }
          if (axiosErr.response?.status === 408) {
            navigate(`/candidate/${testId}/complete`)
            return
          }
        }
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
        setSaveStatus('unsaved')
      }
    },
    [testId, navigate],
  )

  const handleAnswerChange = useCallback(
    (questionId: number, selectedOptionId: number | null, descriptiveAnswer: string | null) => {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId
              ? { ...q, selected_option_id: selectedOptionId, descriptive_answer: descriptiveAnswer }
              : q,
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
    },
    [saveAnswer],
  )

  const handleFlag = async (questionId: number) => {
    try {
      const { data: body } = await candidateApi.put(`/candidate/${testId}/flag`, {
        question_id: questionId,
      })
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, is_flagged: body.is_flagged } : q,
          ),
        }
      })
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

      await candidateApi.post(`/candidate/${testId}/submit`)
      localStorage.removeItem(`test_${testId}_index`)
      navigate(`/candidate/${testId}/complete`)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setError(axiosErr.response?.data?.message || 'Failed to submit')
      } else {
        setError('Network error')
      }
    } finally {
      setSubmitting(false)
      setShowSubmitConfirm(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    localStorage.setItem(`test_${testId}_index`, index.toString())
    setSidebarOpen(false)
  }

  const currentQuestion = data?.questions[currentIndex]
  const answeredCount =
    data?.questions.filter((q) => q.selected_option_id || q.descriptive_answer).length ?? 0
  const flaggedCount = data?.questions.filter((q) => q.is_flagged).length ?? 0
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 0

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 hidden md:block">
            <Skeleton className="h-3 w-40 mb-4" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </aside>
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
          <p className="text-rose-600 dark:text-rose-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  if (!data || !currentQuestion) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{data.candidate_name}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{data.test_id}</span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isWarning
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Time: {formatTime(remainingSeconds)}
          </div>

          <div className="flex items-center gap-1">
            {saveStatus === 'saving' && (
              <span className="text-xs text-slate-400 dark:text-slate-500">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-amber-500">Unsaved</span>
            )}
          </div>

          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Button variant="danger" size="sm" onClick={() => setShowSubmitConfirm(true)}>
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside className={`w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0 p-4 fixed inset-y-0 left-0 z-40 transition-transform duration-250 ease-out md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-4">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Questions ({answeredCount}/{data.questions.length} answered, {flaggedCount} flagged)
            </div>
          </div>

          <div className="space-y-0.5">
            {data.questions.map((q, i) => {
              const isAnswered = !!(q.selected_option_id || q.descriptive_answer)
              const isCurrent = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isCurrent
                      ? 'bg-primary-600 text-white shadow-sm'
                      : isAnswered
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium ${
                      isCurrent ? 'bg-white/20' : 'bg-slate-200/60 dark:bg-slate-600/60'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate flex-1 text-left">
                    {q.text.substring(0, 50)}
                    {q.text.length > 50 ? '...' : ''}
                  </span>
                  {q.is_flagged && (
                    <Flag className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-5 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"></span>
              Answered
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></span>
              Unanswered
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <Flag className="h-3 w-3 text-amber-500" />
              Flagged
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {currentQuestion.category}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Question {currentIndex + 1} of {data.questions.length}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({currentQuestion.marks}{' '}
                  {currentQuestion.marks === 1 ? 'mark' : 'marks'})
                </span>
              </div>

              <button
                onClick={() => handleFlag(currentQuestion.id)}
                className={`p-1.5 rounded-lg transition-all duration-150 ${
                  currentQuestion.is_flagged
                    ? 'text-amber-500 bg-amber-50'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title={
                  currentQuestion.is_flagged ? 'Remove flag' : 'Flag for review'
                }
              >
                <Flag
                  className={`h-4 w-4 ${currentQuestion.is_flagged ? 'fill-amber-500' : ''}`}
                />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5 shadow-xs">
              <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestion.text}
              </p>
              {currentQuestion.image_path && (
                <img
                  src={`/storage/${currentQuestion.image_path}`}
                  alt="Question"
                  className="mt-3 max-w-full rounded-lg border border-slate-200 dark:border-slate-700"
                />
              )}
            </div>

            {currentQuestion.type === 'mcq' ? (
              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      currentQuestion.selected_option_id === option.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion.id}`}
                      checked={currentQuestion.selected_option_id === option.id}
                      onChange={() =>
                        handleAnswerChange(currentQuestion.id, option.id, null)
                      }
                      className="mt-0.5 h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-slate-600 dark:text-slate-300 mr-2 text-sm">
                        {option.label}.
                      </span>
                      <span className="text-sm text-slate-900 dark:text-slate-100">{option.text}</span>
                    </div>
                    {option.image_path && (
                      <img
                        src={`/storage/${option.image_path}`}
                        alt={`Option ${option.label}`}
                        className="max-h-16 rounded"
                      />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-xs">
                <textarea
                  value={currentQuestion.descriptive_answer || ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, null, e.target.value)
                  }
                  placeholder="Type your answer here..."
                  rows={8}
                  className="w-full border-0 focus:ring-0 resize-y text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pb-8">
              <Button
                variant="secondary"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

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
            <Button
              variant="secondary"
              onClick={() => setShowSubmitConfirm(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmit}
              className="flex-1"
              loading={submitting}
            >
              Submit
            </Button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300 mb-2 text-sm">
          You have answered {answeredCount} of {data.questions.length} questions.
          {flaggedCount > 0 && ` ${flaggedCount} questions are flagged for review.`}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Once submitted, you cannot go back to change your answers.
        </p>
      </Modal>
    </div>
  )
}
