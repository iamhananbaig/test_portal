import { useLocation, useNavigate } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()
  const isCandidate = location.pathname.startsWith('/candidate')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <div className="mt-6 flex gap-3 justify-center">
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
