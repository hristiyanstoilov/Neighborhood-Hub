'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

const LEVEL_LABELS = ['', 'Newcomer', 'Helper', 'Contributor', 'Champion', 'Legend']
const LEVEL_COLORS = ['', '#6b7280', '#15803d', '#1d4ed8', '#7c3aed', '#b45309']

type Stats = { totalPoints: number; level: number; rank: number | null }

export function PointsBadge() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    apiFetch('/api/me/stats')
      .then((r) => r.json())
      .then((j) => { if (j?.data) setStats(j.data) })
      .catch(() => undefined)
  }, [])

  if (!stats) return null

  const color = LEVEL_COLORS[stats.level] ?? '#6b7280'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}
        >
          L{stats.level}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{LEVEL_LABELS[stats.level]}</p>
          <p className="text-xs text-gray-500">{stats.totalPoints} pts{stats.rank ? ` · Rank #${stats.rank}` : ''}</p>
        </div>
      </div>
      <Link href="/leaderboard" className="text-xs font-medium text-green-700 hover:underline">
        Leaderboard →
      </Link>
    </div>
  )
}
