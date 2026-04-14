'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function WebError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[web error boundary]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
