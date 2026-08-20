import { useNavigate, useParams } from 'react-router'
import { CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function CandidateComplete() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>

        <h1 className="text-xl font-semibold text-slate-900 mb-1.5">
          Test Submitted Successfully
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Your test{' '}
          <span className="font-mono font-medium text-slate-700">{testId}</span> has been
          submitted and is being processed.
        </p>

        <p className="text-xs text-slate-400 mb-5">
          Please contact your administrator for your results.
        </p>

        <Button variant="secondary" onClick={() => navigate('/candidate')}>
          Return to Login
        </Button>
      </div>
    </div>
  )
}
