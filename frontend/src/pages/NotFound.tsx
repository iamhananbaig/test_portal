import { useLocation, useNavigate } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()
  const isCandidate = location.pathname.startsWith('/candidate')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <AlertTriangle className="h-6 w-6 text-slate-400" />
        </div>
        <h1 className="text-5xl font-bold text-slate-200">404</h1>
        <p className="mt-3 text-base text-slate-600">Page not found</p>
        <div className="mt-5 flex gap-3 justify-center">
          {isCandidate ? (
            <Button onClick={() => navigate('/candidate')}>Candidate Login</Button>
          ) : (
            <Button onClick={() => navigate('/admin')}>Go to Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  )
}
