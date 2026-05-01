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

  // posthog.init is idempotent — safe to call on every render in browser
  if (typeof window !== 'undefined') {
    try {
      posthog.init(key, { api_host: host })
    } catch (e) {
      console.warn('PostHog init failed', e)
    }
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
