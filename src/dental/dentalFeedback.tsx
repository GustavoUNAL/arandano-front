import { useCallback, useEffect, useState } from 'react'

export function useDentalFeedback() {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    type: 'ok' | 'error' | 'info'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const notify = useCallback((message: string, type: 'ok' | 'error' | 'info' = 'ok') => {
    setToast({ type, message })
  }, [])

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      return await fn()
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, setLoading, toast, setToast, notify, withLoading }
}

export function DentalLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="dental-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="dental-loading__card">
        <div className="dental-loading__spinner" aria-hidden />
        <strong>Cargando datos…</strong>
        <span>Un momento mientras consultamos la clínica</span>
      </div>
    </div>
  )
}

export function DentalToast({
  toast,
  onClose,
}: {
  toast: { type: 'ok' | 'error' | 'info'; message: string } | null
  onClose: () => void
}) {
  if (!toast) return null
  return (
    <div
      className={`dental-toast dental-toast--${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <span>{toast.message}</span>
      <button type="button" className="dental-toast__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  )
}
