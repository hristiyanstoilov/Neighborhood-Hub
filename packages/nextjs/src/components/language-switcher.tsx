'use client'

import { useLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'

const LABELS: Record<Locale, string> = { en: 'EN', bg: 'БГ' }

export function LanguageSwitcher() {
  const locale = useLocale() as Locale

  function switchLocale(next: Locale) {
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax; Secure`
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          disabled={loc === locale}
          onClick={() => switchLocale(loc)}
          className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${
            loc === locale
              ? 'bg-green-700 text-white'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  )
}
