import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/ui/Button'

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
        if (!res.ok) throw new Error('Failed to load instructions')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Failed to load test instructions'))
      .finally(() => setLoading(false))
  }, [testId])

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch(`/api/candidate/${testId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 text-white px-8 py-6">
            <h1 className="text-2xl font-bold">Test Instructions</h1>
            <p className="mt-1 text-blue-100">Please read carefully before starting</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Candidate</div>
                <div className="font-semibold text-gray-900">{data?.candidate_name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Test ID</div>
                <div className="font-semibold text-gray-900 font-mono">{data?.test_id}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-semibold text-gray-900">{data?.duration_minutes} minutes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Total Marks</div>
                <div className="font-semibold text-gray-900">{data?.total_marks}</div>
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
                          <td className="px-4 py-2 text-center">{cat.marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  Your test timer starts immediately after clicking &quot;Start Test&quot;.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  You can navigate between questions using the sidebar or Previous/Next buttons.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  Your answers are saved automatically as you make selections.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  You can flag questions for review using the flag icon.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">5.</span>
                  The test will auto-submit when the timer reaches zero.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">6.</span>
                  Do not refresh or close the browser during the test.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">7.</span>
                  This test is best viewed on a desktop or laptop computer.
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => navigate('/candidate')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStart} disabled={starting} className="flex-1">
                {starting ? 'Starting...' : 'Start Test'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
