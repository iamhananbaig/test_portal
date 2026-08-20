import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(onClose, 300)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 flex-shrink-0" />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 flex-shrink-0 text-current opacity-50 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
