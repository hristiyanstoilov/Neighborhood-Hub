'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  function validateField(name: string, value: string) {
    if (name === 'name' && !value.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: t('errors.name_required') }))
    } else if (name === 'email' && !value.includes('@')) {
      setFieldErrors((prev) => ({ ...prev, email: t('errors.invalid_email') }))
    } else if (name === 'password' && value.length > 0 && value.length < 8) {
      setFieldErrors((prev) => ({ ...prev, password: t('errors.password_too_short') }))
    } else {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name as keyof typeof next]; return next })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      const msg: Record<string, string> = {
        EMAIL_TAKEN: t('errors.email_taken'),
        TOO_MANY_REQUESTS: t('errors.too_many_requests'),
        VALIDATION_ERROR: t('errors.unexpected'),
      }
      setError(msg[json.error] ?? t('errors.unexpected'))
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3">{t('check_email_title')}</h1>
        <p className="text-gray-600 mb-6">{t('register_success_desc')}</p>
        <Link href="/login" className="text-green-700 hover:underline text-sm">
          {t('go_to_login')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6">{t('register_title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium mb-1">{t('name')}</label>
          <input
            id="register-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
            onBlur={(e) => validateField('name', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.name ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('name_placeholder')}
          />
          {fieldErrors.name && <p id="register-name-error" className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium mb-1">{t('email')}</label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            onBlur={(e) => validateField('email', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="you@example.com"
          />
          {fieldErrors.email && <p id="register-email-error" className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium mb-1">{t('password')}</label>
          <input
            id="register-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
            onBlur={(e) => validateField('password', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.password ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('new_password_placeholder')}
          />
          {fieldErrors.password && <p id="register-password-error" className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {loading ? t('creating_account') : t('register_btn')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {t('have_account')}{' '}
        <Link href="/login" className="text-green-700 hover:underline">
          {t('sign_in')}
        </Link>
      </p>
    </div>
  )
}
