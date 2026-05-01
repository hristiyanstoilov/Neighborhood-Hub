'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailContent() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const hasToken = Boolean(token)
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!hasToken || !token) {
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(json.data.message)
        } else {
          setStatus('error')
          const msg: Record<string, string> = {
            INVALID_TOKEN: t('invalid_token'),
            TOKEN_EXPIRED: t('invalid_token'),
          }
          setMessage(msg[json.error] ?? t('errors.unexpected'))
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage(t('errors.unexpected'))
      })
  }, [hasToken, token, t])

  return (
    <div className="max-w-md mx-auto text-center py-16">
      {!hasToken ? (
        <>
          <h1 className="text-2xl font-bold mb-3 text-red-600">{t('verification_failed')}</h1>
          <p className="text-gray-600 mb-6">{t('no_token_error')}</p>
          <Link href="/login" className="text-green-700 hover:underline text-sm">
            {t('back_to_login_link')}
          </Link>
        </>
      ) : status === 'loading' ? (
        <p className="text-gray-500">{t('verifying')}</p>
      ) : status === 'success' ? (
        <>
          <h1 className="text-2xl font-bold mb-3 text-green-600">{t('verified_title')}</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login" className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 transition-colors">
            {t('sign_in')}
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-3 text-red-600">{t('verification_failed')}</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login" className="text-green-700 hover:underline text-sm">
            {t('back_to_login_link')}
          </Link>
        </>
      )}
    </div>
  )
}
