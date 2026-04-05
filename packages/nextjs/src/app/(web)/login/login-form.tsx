'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

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
    setLoading(false)

    if (!res.ok) {
      const msg: Record<string, string> = {
        INVALID_CREDENTIALS: 'Invalid email or password.',
        ACCOUNT_LOCKED: 'Account temporarily locked. Please try again later.',
        TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
      }
      setError(msg[json.error] ?? 'Something went wrong. Please try again.')
      return
    }

    login(json.data.accessToken, json.data.user)
    const next = searchParams.get('next') ?? ''
    // Only allow relative paths to prevent open redirect attacks
    const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/skills'
    router.push(safePath)
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-6">Log in</h1>

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

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        No account yet?{' '}
        <Link href="/register" className="text-green-700 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
