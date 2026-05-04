'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { apiFetch } from '@/lib/api'

const STORAGE_KEY = 'nh_cookie_consent'
const CONSENT_VERSION = '1.0'

type ConsentValue = 'accepted' | 'declined'

function getStoredConsent(): ConsentValue | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    return val === 'accepted' || val === 'declined' ? val : null
  } catch {
    return null
  }
}

function applyPosthog(choice: ConsentValue) {
  try {
    if (choice === 'accepted') {
      posthog.opt_in_capturing()
    } else {
      posthog.opt_out_capturing()
    }
  } catch {
    // posthog may not be initialized if key is absent
  }
}

function persistConsent(granted: boolean) {
  apiFetch('/api/consent', {
    method: 'POST',
    body: JSON.stringify({ consentType: 'analytics', granted, version: CONSENT_VERSION }),
  }).catch(() => undefined)
}

export default function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (stored) {
      applyPosthog(stored)
    } else {
      setVisible(true)
    }
  }, [])

  function handleChoice(choice: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // storage unavailable — still apply the choice for this session
    }
    applyPosthog(choice)
    persistConsent(choice === 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <p className="text-sm text-gray-600 mb-3 sm:mb-0">
        {t('text')}{' '}
        <Link href="/privacy" className="underline hover:text-green-700">{t('privacy_link')}</Link>
      </p>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => handleChoice('declined')}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('decline')}
        </button>
        <button
          onClick={() => handleChoice('accepted')}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition-colors"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
