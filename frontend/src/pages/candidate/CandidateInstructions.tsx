import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Clock, BookOpen, AlertTriangle, ArrowLeft, Play } from 'lucide-react'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

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
      .then((data) => { if (data) setData(data) })
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
            <h1 className="text-2xl font-bold">Test Instructions</h1>
            <p className="mt-1 text-blue-100">Please read carefully before starting</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Candidate</div>
                  <div className="font-semibold text-gray-900">{data?.candidate_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <span className="text-gray-400 font-mono text-sm">#</span>
                <div>
                  <div className="text-xs text-gray-500">Test ID</div>
                  <div className="font-semibold text-gray-900 font-mono">{data?.test_id}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="font-semibold text-gray-900">{data?.duration_minutes} minutes</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <span className="text-gray-400 font-semibold text-sm">/</span>
                <div>
                  <div className="text-xs text-gray-500">Total Marks</div>
                  <div className="font-semibold text-gray-900">{data?.total_marks}</div>
                </div>
              </div>
            </div>

            {data?.category_breakdown && data.category_breakdown.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Category Breakdown</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600">Questions</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.category_breakdown.map((cat, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="px-4 py-2">{cat.category}</td>
                          <td className="px-4 py-2 text-center">{cat.count}</td>
                          <td className="px-4 py-2 text-center font-medium">{cat.marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                {instructions.map((instruction, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => navigate('/candidate')} className="flex-1" icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
              <Button onClick={handleStart} loading={starting} className="flex-1" icon={<Play className="h-4 w-4" />}>
                Start Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
