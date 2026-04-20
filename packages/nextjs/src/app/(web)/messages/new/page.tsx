'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth'

export default function NewConversationPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading } = useAuth()
  const [otherUserId, setOtherUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
        Please log in to send messages.
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!otherUserId.trim()) {
      showToast({ variant: 'error', title: 'User ID is required' })
      return
    }

    setSubmitting(true)

    try {
      const res = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ otherUserId: otherUserId.trim() }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.data?.conversationId) {
        showToast({ variant: 'error', title: json?.error ?? 'Could not start conversation' })
        setSubmitting(false)
        return
      }

      router.push(`/messages/${json.data.conversationId}`)
    } catch {
      showToast({ variant: 'error', title: 'Network error. Try again.' })
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Start a conversation</h1>
      <p className="mt-1 text-sm text-gray-600">Paste the target user ID to open a direct message thread.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <label htmlFor="other-user-id" className="mb-1 block text-sm font-medium text-gray-700">
            User ID
          </label>
          <input
            id="other-user-id"
            type="text"
            value={otherUserId}
            onChange={(event) => setOtherUserId(event.target.value)}
            placeholder="UUID of the other user"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {submitting ? 'Starting...' : 'Start conversation'}
        </button>
      </form>
    </div>
  )
}
