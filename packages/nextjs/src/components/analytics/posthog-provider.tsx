'use client'

import React from 'react'
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

type Props = { children: React.ReactNode }

export default function PostHogProviderWrapper({ children }: Props) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

  if (!key) {
    return <>{children}</>
  }

  // posthog.init is idempotent — safe to call on every render in browser.
  // opt_out_capturing_by_default: true ensures no data is sent until the
  // user explicitly accepts via CookieConsentBanner (which calls opt_in_capturing).
  if (typeof window !== 'undefined') {
    try {
      posthog.init(key, {
        api_host: host,
        opt_out_capturing_by_default: true,
      })
    } catch (e) {
      console.warn('PostHog init failed', e)
    }
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
