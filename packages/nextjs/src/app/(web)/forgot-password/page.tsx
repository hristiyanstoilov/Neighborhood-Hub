'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') as string }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json()
      if (json.error === 'TOO_MANY_REQUESTS') {
        setError('Too many attempts. Please wait and try again.')
        return
      }
    }

    // Always show success — never reveal whether the email exists
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3">Check your email</h1>
        <p className="text-gray-600 mb-6">
          If an account with that email exists, we sent a password reset link.
          The link expires in 1 hour.
        </p>
        <Link href="/login" className="text-green-700 hover:underline text-sm">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-2">Forgot your password?</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@example.com"
          />
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
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Remembered it?{' '}
        <Link href="/login" className="text-green-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
