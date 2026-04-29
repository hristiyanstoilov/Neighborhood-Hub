import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'
import { Footer } from '@/components/footer'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export const metadata: Metadata = {
  title: {
    default:  'Neighborhood Hub',
    template: '%s | Neighborhood Hub',
  },
  description: 'Share skills, tools, and time with your neighbors.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
        <Footer />
      </body>
    </html>
  )
}
