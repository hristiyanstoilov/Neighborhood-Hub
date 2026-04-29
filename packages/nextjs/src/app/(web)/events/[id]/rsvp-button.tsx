'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface Props {
  eventId: string
  organizerId: string
  status: string
  initialRsvpStatus: 'attending' | 'cancelled' | null
}

export default function RsvpButton({ eventId, organizerId, status, initialRsvpStatus }: Props) {
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const t = useTranslations('events')
  const tCommon = useTranslations('common')
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvpStatus)
  const [busy, setBusy] = useState(false)

  if (loading) return null

  if (!user) {
    return (
      <Link
        href={`/login?next=/events/${eventId}`}
        className="block w-full text-center bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
      >
        {t('login_to_rsvp')}
      </Link>
    )
  }

  if (user.id === organizerId) {
    return <p className="text-center text-sm text-gray-400 py-2">{t('you_are_organizer')}</p>
  }

  if (status === 'cancelled') {
    return <p className="text-center text-sm text-gray-400 py-2">{t('event_cancelled')}</p>
  }

  if (status === 'completed') {
    return <p className="text-center text-sm text-gray-400 py-2">{t('event_completed')}</p>
  }

  async function handleRsvp() {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          EVENT_FULL:        t('errors.event_full'),
          EVENT_NOT_OPEN:    t('errors.event_not_open'),
          TOO_MANY_REQUESTS: t('errors.too_many_requests'),
        }
        showToast({ variant: 'error', title: t('rsvp_failed_title'), message: msg[json.error] ?? t('errors.unexpected') })
        return
      }
      setRsvpStatus('attending')
      showToast({ variant: 'success', title: t('rsvp_success_title'), message: t('rsvp_success_message') })
    } catch {
      showToast({ variant: 'error', title: tCommon('error'), message: t('errors.network') })
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE' })
      if (!res.ok) {
        showToast({ variant: 'error', title: tCommon('error'), message: tCommon('error') })
        return
      }
      setRsvpStatus('cancelled')
      showToast({ variant: 'success', title: t('rsvp_cancelled_title'), message: t('rsvp_cancelled_message') })
    } catch {
      showToast({ variant: 'error', title: tCommon('error'), message: t('errors.network') })
    } finally {
      setBusy(false)
    }
  }

  if (rsvpStatus === 'attending') {
    return (
      <div className="space-y-2">
        <p className="text-center text-sm font-medium text-green-700 py-1">
          {t('attending')}
        </p>
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="w-full border border-gray-300 text-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {busy ? t('cancelling') : t('cancel_rsvp')}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRsvp}
      disabled={busy}
      className="w-full bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
    >
      {busy ? t('saving') : rsvpStatus === 'cancelled' ? t('re_rsvp_btn') : t('rsvp_btn')}
    </button>
  )
}
