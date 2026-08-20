import { createContext } from 'react'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export interface ToastContextValue {
  toasts: Toast[]
  success: (message: string) => void
  error: (message: string) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
