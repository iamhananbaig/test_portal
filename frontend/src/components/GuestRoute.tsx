import { Navigate } from 'react-router'
import { useAuth } from '@/context/useAuth'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
