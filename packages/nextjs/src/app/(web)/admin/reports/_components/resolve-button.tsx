'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void resolve()}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
    >
      {loading ? '…' : 'Resolve'}
    </button>
  )
}
