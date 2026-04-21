'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth'

interface UserResult {
  id: string
  name: string | null
  avatarUrl: string | null
}

export default function NewConversationPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading } = useAuth()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selected) return

    if (query.length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const json = await res.json().catch(() => null)
        setResults(json?.data?.users ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query, selected])

  async function handleStart() {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ otherUserId: selected.id }),
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

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
        Please log in to send messages.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Start a conversation</h1>
      <p className="mt-1 text-sm text-gray-600">Search by name or email to find a neighbor.</p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        {selected ? (
          <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
            {selected.avatarUrl ? (
              <img src={selected.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700 text-sm font-medium text-white">
                {(selected.name ?? '?')[0].toUpperCase()}
              </div>
            )}
            <span className="flex-1 text-sm font-medium text-gray-900">{selected.name ?? 'Unknown'}</span>
            <button
              type="button"
              onClick={() => { setSelected(null); setQuery(''); setResults([]) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <label htmlFor="user-search" className="mb-1 block text-sm font-medium text-gray-700">
              Search user
            </label>
            <input
              id="user-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name or email…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {searching && (
              <p className="mt-1 text-xs text-gray-400">Searching…</p>
            )}
            {!searching && results.length > 0 && (
              <ul className="mt-1 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white shadow-sm">
                {results.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => { setSelected(u); setResults([]) }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          {(u.name ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-900">{u.name ?? 'Unknown'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No users found.</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!selected || submitting}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {submitting ? 'Starting…' : 'Start conversation'}
        </button>
      </div>
    </div>
  )
}
