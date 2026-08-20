import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  footer?: ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      closeRef.current?.focus()
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white shadow-2xl transition-all`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          {title ? (
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
          ) : <div />}
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
