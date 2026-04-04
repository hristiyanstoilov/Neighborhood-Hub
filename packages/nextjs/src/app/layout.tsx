import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'

export const metadata: Metadata = {
  title: 'Neighborhood Hub',
  description: 'Share skills, tools, and time with your neighbors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
