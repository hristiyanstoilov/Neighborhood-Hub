'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'

type BlockState = { blockedByMe: boolean; blockedByThem: boolean } | null

type BlockButtonProps = {
  userId: string
}

export function BlockButton({ userId }: BlockButtonProps) {
  const t = useTranslations('common')
  const { user } = useAuth()
  const [state, setState] = useState<BlockState>(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.sub === userId) return
    apiFetch(`/api/users/${userId}/block`)
      .then((r) => r.json())
      .then((j) => { if (j?.data) setState(j.data) })
      .catch(() => { /* silent — button simply won't render */ })
  }, [user, userId])

  if (!user || user.sub === userId) return null
  if (state === null) return null
  // Don't reveal to the viewer that they've been blocked
  if (state.blockedByThem && !state.blockedByMe) return null

  async function handleBlock() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch(`/api/users/${userId}/block`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setState({ blockedByMe: true, blockedByThem: state?.blockedByThem ?? false })
    } catch {
      setError(t('block_error'))
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  async function handleUnblock() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch(`/api/users/${userId}/block`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setState({ blockedByMe: false, blockedByThem: state?.blockedByThem ?? false })
    } catch {
      setError(t('block_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {state.blockedByMe ? (
        <button
          type="button"
          onClick={() => void handleUnblock()}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
        >
          {loading ? '…' : t('unblock_user')}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            {t('block_user')}
          </button>

          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
              <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-xl p-5 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">{t('block_confirm_title')}</h3>
                <p className="text-sm text-gray-600">{t('block_confirm_desc')}</p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setConfirmOpen(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                  <button type="button" onClick={() => void handleBlock()} disabled={loading} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                    {loading ? '…' : t('block_confirm_btn')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
