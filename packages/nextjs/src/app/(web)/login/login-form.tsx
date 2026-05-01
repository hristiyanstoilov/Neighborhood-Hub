'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useTranslations } from 'next-intl'

export default function LoginForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.get('email') as string,
          password: form.get('password') as string,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          INVALID_CREDENTIALS: t('errors.invalid_credentials'),
          ACCOUNT_LOCKED: t('errors.account_locked'),
          TOO_MANY_REQUESTS: t('errors.too_many_requests'),
        }
        setError(msg[json.error] ?? t('errors.unexpected'))
        return
      }

      login(json.data.accessToken, json.data.user)
      const next = searchParams.get('next') ?? ''
      // Only allow relative paths to prevent open redirect attacks
      const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/skills'
      router.push(safePath)
    } catch {
      setError(t('errors.network_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6">{t('login_title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1">{t('email')}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-sm font-medium">{t('password')}</label>
            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-green-700 transition-colors">
              {t('forgot_password')}
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <p id="login-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {loading ? t('signing_in') : t('login_btn')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {t('no_account')}{' '}
        <Link href="/register" className="text-green-700 hover:underline">
          {t('sign_up')}
        </Link>
      </p>
    </div>
  )
}
