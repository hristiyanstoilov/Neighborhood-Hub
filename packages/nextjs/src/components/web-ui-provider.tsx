'use client'

import { ToastProvider } from '@/components/ui/toast'

export function WebUIProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}