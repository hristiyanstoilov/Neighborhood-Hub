'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'

const LEVEL_COLORS = ['#6b7280', '#6b7280', '#15803d', '#1d4ed8', '#7c3aed', '#b45309', '#dc2626']
const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Entry = {
  userId:      string
  totalPoints: number
  level:       number
  name:        string | null
  avatarUrl:   string | null
}

type MyStats = {
  totalPoints: number
  level:       number
  rank:        number | null
  totalUsers:  number
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard')
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [myStats, setMyStats] = useState<MyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    const fetches: Promise<void>[] = [
      apiFetch('/api/leaderboard')
        .then((r) => r.json())
        .then((j) => setEntries(Array.isArray(j?.data) ? j.data : []))
        .catch(() => setError(true)),
    ]

    if (!authLoading && user) {
      fetches.push(
        apiFetch('/api/me/stats')
          .then((r) => r.json())
          .then((j) => { if (j?.data) setMyStats(j.data) })
          .catch(() => { /* stats are optional — fail silently */ })
      )
    }

    Promise.all(fetches).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const percentile =
    myStats?.rank != null && myStats.totalUsers > 0
      ? Math.ceil((myStats.rank / myStats.totalUsers) * 100)
      : null

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Personal progress banner */}
      {!authLoading && user && !loading && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">{t('your_progress')}</p>
            {percentile != null ? (
              <>
                <p className="text-2xl font-bold text-green-800 leading-tight">
                  {t('top_percent', { percent: percentile })}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {t('rank_of', { rank: myStats!.rank, total: myStats!.totalUsers })}
                </p>
              </>
            ) : (
              <p className="text-sm text-green-700 mt-0.5">{t('no_rank_yet')}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-green-800">{myStats?.totalPoints ?? 0}</p>
            <p className="text-xs text-green-600">{t('pts')}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{t('error')}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-sm text-gray-500">{t('empty')}</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol className="space-y-2">
          {entries.map((e, i) => {
            const rank  = i + 1
            const color = LEVEL_COLORS[e.level] ?? '#6b7280'
            const medal = RANK_MEDAL[rank]
            const initials = (e.name ?? '?')[0].toUpperCase()
            const levelKey = String(Math.min(e.level, 6)) as '1' | '2' | '3' | '4' | '5' | '6'
            return (
              <li key={rank} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-green-300 transition-colors">
                <Link href={`/users/${e.userId}`} className="contents">
                <span className="w-8 text-center text-sm font-semibold text-gray-500">
                  {medal ?? `#${rank}`}
                </span>
                {e.avatarUrl ? (
                  <Image src={e.avatarUrl} alt={e.name ?? t('anonymous')} width={36} height={36} unoptimized className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{e.name ?? t('anonymous')}</p>
                  <p className="text-xs text-gray-500">{t(`levels.${levelKey}`)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{e.totalPoints}</p>
                  <p className="text-xs text-gray-400">{t('pts')}</p>
                </div>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
