import { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function CandidateLogin() {
  const [testId, setTestId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/candidate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ test_id: testId.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Test not found')
        return
      }

      if (data.status === 'in_progress') {
        navigate(`/candidate/${testId.trim().toUpperCase()}/test`)
      } else if (data.status === 'ready') {
        navigate(`/candidate/${testId.trim().toUpperCase()}/instructions`)
      } else {
        setError(data.message || 'Test cannot be accessed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Portal</h1>
          <p className="mt-2 text-gray-600">Enter your Test ID to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Test ID"
              placeholder="e.g. A8KM-P2Q7"
              value={testId}
              onChange={(e) => setTestId(e.target.value.toUpperCase())}
              error={error}
              required
              autoFocus
              autoComplete="off"
            />

            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!testId.trim()} icon={<LogIn className="h-4 w-4" />}>
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Contact your administrator if you don&apos;t have a Test ID
        </p>
      </div>
    </div>
  )
}
