import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Clock, BookOpen, AlertTriangle, ArrowLeft, Play } from 'lucide-react'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Table, { TableRow, TableCell } from '../../components/ui/Table'

interface CategoryBreakdown {
  category: string
  count: number
  marks: number
}

interface InstructionsData {
  test_id: string
  candidate_name: string
  duration_minutes: number
  total_marks: number
  status: string
  category_breakdown: CategoryBreakdown[]
}

const instructions = [
  'Your test timer starts immediately after clicking "Start Test".',
  'You can navigate between questions using the sidebar or Previous/Next buttons.',
  'Your answers are saved automatically as you make selections.',
  'You can flag questions for review using the flag icon.',
  'The test will auto-submit when the timer reaches zero.',
  'Do not refresh or close the browser during the test.',
  'This test is best viewed on a desktop or laptop computer.',
]

export default function CandidateInstructions() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<InstructionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/candidate/${testId}/instructions`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.status === 408) {
          navigate(`/candidate/${testId}/complete`)
          return null
        }
        if (!res.ok) throw new Error('Failed to load instructions')
        return res.json()
      })
      .then((data) => {
        if (data) setData(data)
      })
      .catch(() => setError('Failed to load test instructions'))
      .finally(() => setLoading(false))
  }, [testId, navigate])

  const handleStart = async () => {
    setStarting(true)
    setError('')
    try {
      const res = await fetch(`/api/candidate/${testId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })

      if (res.status === 408) {
        navigate(`/candidate/${testId}/complete`)
        return
      }

      if (!res.ok) {
        const body = await res.json()
        setError(body.message || 'Failed to start test')
        return
      }

      navigate(`/candidate/${testId}/test`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
          <p className="text-rose-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-5">
            <h1 className="text-xl font-semibold">Test Instructions</h1>
            <p className="mt-0.5 text-primary-100 text-sm">
              Please read carefully before starting
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Candidate</div>
                  <div className="text-sm font-medium text-slate-900">{data?.candidate_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                <span className="text-slate-400 font-mono text-xs">#</span>
                <div>
                  <div className="text-xs text-slate-400">Test ID</div>
                  <div className="text-sm font-medium text-slate-900 font-mono">
                    {data?.test_id}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Duration</div>
                  <div className="text-sm font-medium text-slate-900">
                    {data?.duration_minutes} minutes
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                <span className="text-slate-400 font-semibold text-xs">/</span>
                <div>
                  <div className="text-xs text-slate-400">Total Marks</div>
                  <div className="text-sm font-medium text-slate-900">{data?.total_marks}</div>
                </div>
              </div>
            </div>

            {data?.category_breakdown && data.category_breakdown.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2 text-sm">Category Breakdown</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table
                    columns={[
                      { key: 'category', header: 'Category' },
                      { key: 'questions', header: 'Questions', className: 'text-center' },
                      { key: 'marks', header: 'Marks', className: 'text-center' },
                    ]}
                  >
                    {data.category_breakdown.map((cat, i) => (
                      <TableRow key={i}>
                        <TableCell>{cat.category}</TableCell>
                        <TableCell className="text-center">{cat.count}</TableCell>
                        <TableCell className="text-center font-medium">{cat.marks}</TableCell>
                      </TableRow>
                    ))}
                  </Table>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-slate-900 mb-2 text-sm">Instructions</h3>
              <ol className="space-y-2 text-sm text-slate-600">
                {instructions.map((instruction, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/candidate')}
                className="flex-1"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                onClick={handleStart}
                loading={starting}
                className="flex-1"
                icon={<Play className="h-4 w-4" />}
              >
                Start Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
