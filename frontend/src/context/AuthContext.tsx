import { useState, useCallback, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import api from '@/services/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import('./auth-context').User | null>(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { user: userData, token: tokenData } = response.data
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
