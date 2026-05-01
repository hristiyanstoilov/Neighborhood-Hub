'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'

const LEVEL_COLORS = ['', '#6b7280', '#15803d', '#1d4ed8', '#7c3aed', '#b45309']

type Stats = { totalPoints: number; level: number; rank: number | null }

export function PointsBadge() {
  const t = useTranslations('leaderboard')
  const tProfile = useTranslations('profile')
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    apiFetch('/api/me/stats')
      .then((r) => r.json())
      .then((j) => { if (j?.data) setStats(j.data) })
      .catch(() => undefined)
  }, [])

  if (!stats) return null

  const color = LEVEL_COLORS[stats.level] ?? '#6b7280'
  const levelKey = String(stats.level) as '1' | '2' | '3' | '4' | '5'

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
          <p className="text-sm font-semibold text-gray-900">{t(`levels.${levelKey}`)}</p>
          <p className="text-xs text-gray-500">
            {stats.totalPoints} {t('pts')}
            {stats.rank ? ` · ${tProfile('rank', { rank: stats.rank })}` : ''}
          </p>
        </div>
      </div>
      <Link href="/leaderboard" className="text-xs font-medium text-green-700 hover:underline">
        {tProfile('leaderboard_link')}
      </Link>
    </div>
  )
}
