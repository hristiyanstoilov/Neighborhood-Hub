'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailContent() {
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
            INVALID_TOKEN: 'This verification link is invalid.',
            TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
          }
          setMessage(msg[json.error] ?? 'Verification failed.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [hasToken, token])

  return (
    <div className="max-w-md mx-auto text-center py-16">
      {!hasToken ? (
        <>
          <h1 className="text-2xl font-bold mb-3 text-red-600">Verification failed</h1>
          <p className="text-gray-600 mb-6">No verification token found in the link.</p>
          <Link href="/login" className="text-green-700 hover:underline text-sm">
            Back to login
          </Link>
        </>
      ) : status === 'loading' ? (
        <p className="text-gray-500">Verifying your email…</p>
      ) : status === 'success' ? (
        <>
          <h1 className="text-2xl font-bold mb-3 text-green-600">Email verified!</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login" className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 transition-colors">
            Log in
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-3 text-red-600">Verification failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/login" className="text-green-700 hover:underline text-sm">
            Back to login
          </Link>
        </>
      )}
    </div>
  )
}
