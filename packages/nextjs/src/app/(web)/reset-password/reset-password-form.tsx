'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ResetPasswordForm() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3 text-red-600">{t('invalid_reset_link')}</h1>
        <Link href="/forgot-password" className="text-green-700 hover:underline text-sm">
          {t('request_new_link')}
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3 text-green-600">{t('password_changed_title')}</h1>
        <Link href="/login" className="text-green-700 hover:underline text-sm">
          {t('sign_in')} →
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = (form.get('password') as string).trim()
    const confirm = (form.get('confirm') as string).trim()

    if (password.length < 8) {
      setError(t('errors.password_too_short'))
      return
    }

    if (password !== confirm) {
      setError(t('errors.passwords_mismatch'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          INVALID_TOKEN: t('errors.invalid_token'),
          TOKEN_EXPIRED: t('errors.token_expired'),
          VALIDATION_ERROR: t('errors.password_too_short'),
        }
        setError(msg[json.error] ?? t('errors.unexpected'))
        return
      }

      setSuccess(true)
    } catch {
      setError(t('errors.network_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-2">{t('set_password_btn')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('password_hint')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium mb-1">{t('new_password')}</label>
          <input
            id="reset-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('new_password_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="reset-password-confirm" className="block text-sm font-medium mb-1">{t('confirm_password')}</label>
          <input
            id="reset-password-confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('repeat_password_placeholder')}
          />
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {loading ? t('updating') : t('set_password_btn')}
        </button>
      </form>
    </div>
  )
}
