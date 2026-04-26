'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { apiFetch } from '@/lib/api'

const LEVEL_LABELS = ['', 'Newcomer', 'Helper', 'Contributor', 'Champion', 'Legend']
const LEVEL_COLORS = ['', '#6b7280', '#15803d', '#1d4ed8', '#7c3aed', '#b45309']

type Entry = {
  userId:      string
  totalPoints: number
  level:       number
  name:        string | null
  avatarUrl:   string | null
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    apiFetch('/api/leaderboard')
      .then((r) => r.json())
      .then((j) => setEntries(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">Top neighbors by Neighbor Score</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Could not load leaderboard. Please refresh.</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-sm text-gray-500">No entries yet. Be the first to earn points!</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol className="space-y-2">
          {entries.map((e, i) => {
            const rank  = i + 1
            const color = LEVEL_COLORS[e.level] ?? '#6b7280'
            const medal = RANK_MEDAL[rank]
            const initials = (e.name ?? '?')[0].toUpperCase()
            return (
              <li
                key={e.userId}
                className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <span className="w-8 text-center text-sm font-semibold text-gray-500">
                  {medal ?? `#${rank}`}
                </span>

                {e.avatarUrl ? (
                  <Image
                    src={e.avatarUrl}
                    alt={e.name ?? 'User'}
                    width={36}
                    height={36}
                    unoptimized
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{e.name ?? 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">{LEVEL_LABELS[e.level]}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{e.totalPoints}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
