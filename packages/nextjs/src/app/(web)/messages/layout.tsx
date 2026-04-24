import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Direct conversations with your neighbors.',
}

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
