'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'

const LABELS: Record<Locale, string> = { en: 'EN', bg: 'БГ' }

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: Locale) {
    startTransition(() => {
      document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`
      window.location.reload()
    })
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          disabled={isPending || loc === locale}
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
