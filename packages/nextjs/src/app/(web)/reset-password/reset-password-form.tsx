'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3 text-red-600">Invalid link</h1>
        <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-green-700 hover:underline text-sm">
          Request a new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-3 text-green-600">Password updated!</h1>
        <p className="text-gray-600 mb-6">
          Your password has been changed. You have been logged out of all devices.
        </p>
        <Link
          href="/login"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 transition-colors"
        >
          Log in
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      const msg: Record<string, string> = {
        INVALID_TOKEN: 'This reset link is invalid.',
        TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
        VALIDATION_ERROR: 'Password must be at least 8 characters.',
      }
      setError(msg[json.error] ?? 'Something went wrong. Please try again.')
      return
    }

    setSuccess(true)
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
      <p className="text-gray-500 text-sm mb-6">Choose a strong password — at least 8 characters.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Repeat your password"
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
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
