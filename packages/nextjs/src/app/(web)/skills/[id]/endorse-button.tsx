'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'

export function EndorseButton({ skillId }: { skillId: string }) {
  const t = useTranslations('skills')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleEndorse() {
    setState('loading')
    try {
      const res = await apiFetch(`/api/skills/${skillId}/endorse`, { method: 'POST' })
      if (res.ok || res.status === 409) {
        setState('done')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return <span className="text-sm font-medium text-green-700">{t('endorse_done')}</span>
  }

  if (state === 'error') {
    return <span className="text-sm text-red-600">{t('endorse_error')}</span>
  }

  return (
    <button
      type="button"
      onClick={() => void handleEndorse()}
      disabled={state === 'loading'}
      className="text-sm font-medium text-gray-500 border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {state === 'loading' ? '…' : t('endorse_btn')}
    </button>
  )
}
