'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePostHog } from 'posthog-js/react'
import { useCreateReservation } from './_hooks/use-create-reservation'

type ReserveButtonProps = {
  toolId: string
  toolTitle: string
  isOwner: boolean
  isLoggedIn: boolean
  isAvailable: boolean
}

export default function ReserveButton({
  toolId,
  toolTitle,
  isOwner,
  isLoggedIn,
  isAvailable,
}: ReserveButtonProps) {
  const router = useRouter()
  const posthog = usePostHog()
  const t = useTranslations('tools')
  const tCommon = useTranslations('common')
  const [open, setOpen]         = useState(false)
  const [startDate, setStart]   = useState('')
  const [endDate, setEnd]       = useState('')
  const [notes, setNotes]       = useState('')
  const [returnBy, setReturnBy] = useState('')
  const reservation             = useCreateReservation()

  const handleClose = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (isOwner) return null
  if (!isAvailable) {
    return (
      <p className="text-sm text-gray-400 mt-4">{t('tool_unavailable')}</p>
    )
  }

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => router.push('/login?next=' + encodeURIComponent(`/tools/${toolId}`))}
        className="mt-4 w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors"
      >
        {t('login_to_reserve')}
      </button>
    )
  }

  const handleOpen = () => {
    setStart('')
    setEnd('')
    setNotes('')
    setReturnBy('')
    reservation.reset()
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement)
      await reservation.mutateAsync({
        toolId,
        startDate,
        endDate,
        notes: notes || undefined,
        returnBy: (form.get('returnBy') as string) || undefined,
      })
      posthog?.capture('tool_reserved', {})
      setOpen(false)
      router.push('/my-reservations')
    } catch {
      // error shown via reservation.error
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="mt-4 w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors"
      >
        {t('reserve_btn')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={handleClose}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{t('reserve_dialog_title', { title: toolTitle })}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="res-start" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reserve_start_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="res-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="res-end" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reserve_end_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="res-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEnd(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="res-notes" className="block text-sm font-medium text-gray-700 mb-1">{t('reserve_notes_label')}</label>
                <textarea
                  id="res-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t('reserve_notes_placeholder')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label htmlFor="res-return-by" className="block text-sm font-medium text-gray-700 mb-1">
                  Return by (optional)
                </label>
                <input
                  id="res-return-by"
                  name="returnBy"
                  type="date"
                  value={returnBy}
                  onChange={(e) => setReturnBy(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {reservation.error && (
                <p className="text-sm text-red-600">{reservation.error.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reservation.isPending || !startDate || !endDate}
                  className="flex-1 bg-green-700 text-white py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reservation.isPending ? t('sending') : t('send_request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
