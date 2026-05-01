import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { routing } from './routing'

export default getRequestConfig(async () => {
  let locale = routing.defaultLocale

  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('locale')?.value ?? ''
    if ((routing.locales as readonly string[]).includes(raw)) {
      locale = raw as (typeof routing.locales)[number]
    }
  } catch {
    // cookies() throws during static generation (e.g. /_not-found) — fall back to default locale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
