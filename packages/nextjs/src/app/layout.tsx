import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import PostHogProviderWrapper from '@/components/analytics/posthog-provider'
import CookieConsentBanner from '@/components/analytics/cookie-consent-banner'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

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
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PostHogProviderWrapper>
            <AuthProvider>{children}</AuthProvider>
            <CookieConsentBanner />
          </PostHogProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
