'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface Pledge {
  id: string
  userId: string
  pledgeDescription: string
  status: string
  createdAt: Date
  userName: string | null
}

interface Props {
  driveId: string
  organizerId: string
  driveStatus: string
  initialPledge: { id: string; status: string; pledgeDescription: string } | null
  pledges: Pledge[]
}

export default function PledgeSection({ driveId, organizerId, driveStatus, initialPledge, pledges: initialPledges }: Props) {
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const t = useTranslations('drives')
  const [pledge, setPledge] = useState(initialPledge)
  const [pledges] = useState(initialPledges)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (loading) return null

  const isOrganizer = user?.id === organizerId
  const isOpen = driveStatus === 'open'

  async function handlePledge(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setFormError(t('errors.description_required')); return }
    setFormError(null)
    setBusy(true)
    try {
      const res = await apiFetch(`/api/drives/${driveId}/pledges`, {
        method: 'POST',
        body: JSON.stringify({ pledgeDescription: description.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          DRIVE_NOT_OPEN:          t('errors.drive_not_open'),
          CANNOT_PLEDGE_OWN_DRIVE: t('errors.cannot_pledge_own'),
          TOO_MANY_REQUESTS:       t('errors.too_many_requests'),
        }
        setFormError(msg[json.error] ?? t('errors.unexpected'))
        return
      }
      setPledge({ id: json.data.id, status: 'pledged', pledgeDescription: description.trim() })
      setDescription('')
      showToast({ variant: 'success', title: t('pledge_success_title'), message: t('pledge_success_message') })
    } catch {
      setFormError(t('errors.network'))
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (!pledge) return
    setBusy(true)
    try {
      const res = await apiFetch(`/api/drives/${driveId}/pledges/${pledge.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        showToast({ variant: 'error', title: t('errors.unexpected'), message: t('errors.network') })
        return
      }
      setPledge({ ...pledge, status: 'cancelled' })
      showToast({ variant: 'success', title: t('pledge_cancelled_title'), message: t('pledge_cancelled_message') })
    } catch {
      showToast({ variant: 'error', title: t('errors.unexpected'), message: t('errors.network') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Pledge list */}
      {pledges.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {t('pledges_count', { count: pledges.filter(p => p.status !== 'cancelled').length })}
          </h2>
          <ul className="space-y-2">
            {pledges.map((p) => (
              <li
                key={p.id}
                className={`text-sm px-3 py-2 rounded-md border ${
                  p.status === 'fulfilled'
                    ? 'bg-green-50 border-green-200'
                    : p.status === 'cancelled'
                    ? 'bg-gray-50 border-gray-100 text-gray-400 line-through'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span className="font-medium">{p.userName ?? t('anonymous')}</span>
                {' — '}
                {p.pledgeDescription}
                {p.status === 'fulfilled' && (
                  <span className="ml-2 text-xs text-green-600 font-medium">{t('pledge_fulfilled')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA / form */}
      {!user && (
        <Link
          href={`/login?next=/drives/${driveId}`}
          className="block w-full text-center bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
        >
          {t('login_to_pledge')}
        </Link>
      )}

      {user && isOrganizer && (
        <p className="text-center text-sm text-gray-400 py-2">{t('you_are_organizer')}</p>
      )}

      {user && !isOrganizer && !isOpen && (
        <p className="text-center text-sm text-gray-400 py-2">{t('drive_closed')}</p>
      )}

      {user && !isOrganizer && isOpen && (
        <>
          {pledge?.status === 'pledged' ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm">
                <p className="font-medium text-green-800 mb-0.5">{t('your_pledge')}</p>
                <p className="text-green-700">{pledge.pledgeDescription}</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="w-full border border-gray-300 text-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {busy ? t('cancelling') : t('cancel_pledge')}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePledge} className="space-y-3">
              <div>
                <label htmlFor="pledge-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  {pledge?.status === 'cancelled' ? t('update_pledge_label') : t('make_pledge_label')}
                </label>
                <textarea
                  id="pledge-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder={t('pledge_placeholder')}
                />
              </div>
              {formError && (
                <p role="alert" className="text-sm text-red-600">{formError}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {busy ? t('saving') : t('pledge_btn')}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
