import { useNavigate, useParams } from 'react-router'

export default function CandidateComplete() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Submitted Successfully</h1>
        <p className="text-gray-600 mb-8">
          Your test <span className="font-mono font-medium">{testId}</span> has been submitted and is being processed.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Please contact your administrator for your results.
        </p>

        <button
          onClick={() => navigate('/candidate')}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Return to Login
        </button>
      </div>
    </div>
  )
}
