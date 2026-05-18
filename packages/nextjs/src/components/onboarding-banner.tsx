'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'onboarding_dismissed'

export function OnboardingBanner() {
  const t = useTranslations('landing')
  const [visible, setVisible] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    let shouldShow = false
    try {
      shouldShow = !localStorage.getItem(STORAGE_KEY)
    } catch {
      // localStorage unavailable (private/incognito with strict settings)
    }
    // Schedule outside the effect body to satisfy react-hooks/set-state-in-effect
    if (!shouldShow) return
    const t = setTimeout(() => { setVisible(true) }, 0)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">{t('onboarding_title')}</p>
          <p className="text-xs text-blue-700 mt-0.5 mb-3">{t('onboarding_subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile" className="text-xs font-medium bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
              {t('onboarding_action_profile')}
            </Link>
            <Link href="/skills/new" className="text-xs font-medium bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
              {t('onboarding_action_skill')}
            </Link>
            <Link href="/skills" className="text-xs font-medium bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
              {t('onboarding_action_browse')}
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
        >
          {t('onboarding_dismiss')}
        </button>
      </div>
    </div>
  )
}
