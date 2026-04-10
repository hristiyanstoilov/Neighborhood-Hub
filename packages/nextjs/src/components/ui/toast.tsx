'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastInput = {
  title: string
  message?: string
  variant?: ToastVariant
}

type Toast = ToastInput & {
  id: string
}

type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function getToastStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900'
    default:
      return 'border-slate-200 bg-white text-slate-900'
  }
}

function getAccentStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'bg-green-600'
    case 'error':
      return 'bg-red-600'
    default:
      return 'bg-slate-600'
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const nextToast: Toast = {
      id,
      title: toast.title,
      message: toast.message,
      variant: toast.variant ?? 'info',
    }

    setToasts((current) => [...current, nextToast])

    globalThis.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto overflow-hidden rounded-xl border shadow-lg ${getToastStyles(toast.variant ?? 'info')}`}
          >
            <div className={`h-1 w-full ${getAccentStyles(toast.variant ?? 'info')}`} />
            <div className="p-4">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm text-current/80">{toast.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return ctx
}