'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

type Report = {
  id: string
  targetType: string
  targetId: string
  reason: string
  details: string | null
  status: string
  reviewedAt: string | null
  createdAt: string
  reporterName: string | null
  reporterEmail: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  reviewed:  'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'dismissed' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load(status: typeof filter) {
    setLoading(true)
    try {
      const params = status !== 'all' ? `?status=${status}` : ''
      const res = await apiFetch(`/api/admin/reports${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setReports(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(filter) }, [filter])

  async function handleAction(id: string, status: 'reviewed' | 'dismissed') {
    setActionLoading(id)
    setActionError(null)
    try {
      const res = await apiFetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      void load(filter)
    } catch {
      setActionError('Action failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2 text-sm">
          {(['pending', 'reviewed', 'dismissed', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md capitalize border transition-colors ${
                filter === s
                  ? 'bg-green-700 text-white border-green-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {!loading && reports.length === 0 && (
        <p className="text-sm text-gray-500">No reports found.</p>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? STATUS_STYLES.dismissed}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-500 font-medium uppercase">{r.targetType}</span>
                  <span className="text-xs text-gray-400 font-mono truncate max-w-[140px]">{r.targetId}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Reason:</span> {r.reason}
                {r.details && <span className="text-gray-500"> — {r.details}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Reported by: {r.reporterName ?? 'Unknown'} ({r.reporterEmail ?? '—'})
              </p>

              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={actionLoading === r.id}
                    onClick={() => void handleAction(r.id, 'reviewed')}
                    className="text-xs px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-60"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === r.id}
                    onClick={() => void handleAction(r.id, 'dismissed')}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
