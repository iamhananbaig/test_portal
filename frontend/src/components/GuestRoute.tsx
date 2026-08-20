import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
