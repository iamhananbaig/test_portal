import { useNavigate, useParams } from 'react-router'
import { CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function CandidateComplete() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Submitted Successfully</h1>
        <p className="text-gray-600 mb-8">
          Your test <span className="font-mono font-medium">{testId}</span> has been submitted and is being processed.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Please contact your administrator for your results.
        </p>

        <Button variant="secondary" onClick={() => navigate('/candidate')}>
          Return to Login
        </Button>
      </div>
    </div>
  )
}
