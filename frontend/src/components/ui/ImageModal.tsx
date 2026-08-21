import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

export default function ImageModal({ src, alt = '', open, onClose }: ImageModalProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-w-4xl w-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
          onClick={onClose}
        />
      </div>
    </div>,
    document.body,
  )
}
