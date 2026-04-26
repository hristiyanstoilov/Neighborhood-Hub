'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, setAccessToken } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export function DangerZone() {
  const router = useRouter()
  const { showToast } = useToast()

  const [deleteOpen, setDeleteOpen]       = useState(false)
  const [password, setPassword]           = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

  async function handleExport() {
    try {
      const res = await apiFetch('/api/account')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neighborhood-hub-data.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast({ variant: 'error', title: 'Export failed', message: 'Please try again.' })
    }
  }

  async function handleDelete() {
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await apiFetch('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        const msgs: Record<string, string> = {
          INVALID_PASSWORD:  'Incorrect password. Please try again.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        }
        setDeleteError(msgs[json?.error] ?? 'Something went wrong. Please try again.')
        return
      }

      setAccessToken(null)
      router.push('/login?deleted=1')
    } catch {
      setDeleteError('Network error. Please check your connection.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mt-8 border border-red-200 rounded-lg p-5 bg-red-50">
      <h2 className="text-base font-semibold text-red-800 mb-1">Danger Zone</h2>
      <p className="text-sm text-red-700 mb-4">These actions are irreversible. Please proceed with caution.</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Export my data
        </button>
        <button
          type="button"
          onClick={() => { setDeleteOpen(true); setPassword(''); setDeleteError(null) }}
          className="text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Delete my account
        </button>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={deleteLoading ? undefined : () => setDeleteOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete account"
            className="relative w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl p-5"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete your account?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently remove your personal data, profile, and all your listings.
              This action cannot be undone.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm your password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your current password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
              autoComplete="current-password"
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteLoading}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteLoading || !password}
                className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
