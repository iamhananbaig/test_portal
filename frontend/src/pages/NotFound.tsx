import { useNavigate } from 'react-router'
import Button from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <Button onClick={() => navigate('/admin')} className="mt-6">
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
