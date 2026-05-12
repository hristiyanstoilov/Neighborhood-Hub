'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

type ActionResult = {
  loading: boolean
  result: string | null
  error: string | null
}

const INITIAL: ActionResult = { loading: false, result: null, error: null }

export function MaintenancePanel() {
  const [purgeState, setPurgeState] = useState<ActionResult>(INITIAL)
  const [cleanupState, setCleanupState] = useState<ActionResult>(INITIAL)
  const [recalcState, setRecalcState] = useState<ActionResult>(INITIAL)

  async function handlePurge() {
    if (!window.confirm('This will permanently delete all accounts soft-deleted more than 30 days ago. This cannot be undone. Continue?')) return
    setPurgeState({ loading: true, result: null, error: null })
    try {
      const res = await apiFetch('/api/admin/purge-deleted-users', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      setPurgeState({
        loading: false,
        result: `Purged ${json.data.purgedCount} account(s). Cutoff: ${new Date(json.data.cutoffDate).toLocaleDateString('en-GB')}`,
        error: null,
      })
    } catch (err) {
      setPurgeState({ loading: false, result: null, error: String(err) })
    }
  }

  async function handleCleanup() {
    setCleanupState({ loading: true, result: null, error: null })
    try {
      const res = await apiFetch('/api/admin/cleanup', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      setCleanupState({
        loading: false,
        result: `Deleted ${json.data.deleted} old notification(s).`,
        error: null,
      })
    } catch (err) {
      setCleanupState({ loading: false, result: null, error: String(err) })
    }
  }

  async function handleRecalc() {
    setRecalcState({ loading: true, result: null, error: null })
    try {
      const res = await apiFetch('/api/admin/recalc-ratings', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      setRecalcState({
        loading: false,
        result: `Recalculated ${json.data.updated} profile(s).`,
        error: null,
      })
    } catch (err) {
      setRecalcState({ loading: false, result: null, error: String(err) })
    }
  }

  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Maintenance</h3>
      <div className="space-y-4">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">GDPR Hard Purge</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete accounts soft-deleted more than 30 days ago. Cascades to all related data.
            </p>
            {purgeState.result && <p className="text-xs text-green-700 mt-1">{purgeState.result}</p>}
            {purgeState.error && <p className="text-xs text-red-600 mt-1">{purgeState.error}</p>}
          </div>
          <button
            type="button"
            onClick={handlePurge}
            disabled={purgeState.loading}
            className="shrink-0 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {purgeState.loading ? 'Running…' : 'Run Purge'}
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Notification Cleanup</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Delete read notifications older than 90 days.
            </p>
            {cleanupState.result && <p className="text-xs text-green-700 mt-1">{cleanupState.result}</p>}
            {cleanupState.error && <p className="text-xs text-red-600 mt-1">{cleanupState.error}</p>}
          </div>
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleanupState.loading}
            className="shrink-0 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {cleanupState.loading ? 'Running…' : 'Run Cleanup'}
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Recalculate Ratings</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Recompute avgRating and ratingCount for all profiles from the ratings table.
            </p>
            {recalcState.result && <p className="text-xs text-green-700 mt-1">{recalcState.result}</p>}
            {recalcState.error && <p className="text-xs text-red-600 mt-1">{recalcState.error}</p>}
          </div>
          <button
            type="button"
            onClick={handleRecalc}
            disabled={recalcState.loading}
            className="shrink-0 px-3 py-1.5 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {recalcState.loading ? 'Running…' : 'Recalculate'}
          </button>
        </div>

      </div>
    </div>
  )
}
