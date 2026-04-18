import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: {
    default:  'Neighborhood Hub',
    template: '%s | Neighborhood Hub',
  },
  description: 'Share skills, tools, and time with your neighbors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
        <Footer />
      </body>
    </html>
  )
}
