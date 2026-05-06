'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'

interface Props {
  userId: string
  initialBlocked?: boolean
}

export function BlockButton({ userId, initialBlocked = false }: Props) {
  const t = useTranslations('common')
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleBlock() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/users/${userId}/block`, { method: 'POST' })
      if (res.ok) setBlocked(true)
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  async function handleUnblock() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/users/${userId}/block`, { method: 'DELETE' })
      if (res.ok) setBlocked(false)
    } finally {
      setLoading(false)
    }
  }

  if (blocked) {
    return (
      <button
        type="button"
        onClick={() => void handleUnblock()}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
      >
        {loading ? '…' : t('unblock_user')}
      </button>
    )
  }

  return (
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
  )
}
