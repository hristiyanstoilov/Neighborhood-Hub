'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth'
import { type CreateRequestBody, useCreateRequest } from './_hooks/use-create-request'
import posthog from 'posthog-js'

interface Props {
  skill: { id: string; ownerId: string; status: string }
}

export default function RequestButton({ skill }: Props) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [meetingType, setMeetingType] = useState<'in_person' | 'online' | 'hybrid'>('in_person')
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const startInputRef = useRef<HTMLInputElement>(null)
  const createRequest = useCreateRequest()
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')

  useEffect(() => {
    if (!open) return

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    startInputRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [open])

  if (loading) return null

  if (!user) {
    return (
      <Link
        href={`/login?next=/skills/${skill.id}`}
        className="block w-full text-center bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
      >
        {t('login_to_request')}
      </Link>
    )
  }

  if (user.id === skill.ownerId) {
    return (
      <p className="text-center text-sm text-gray-400 py-2">{t('your_skill_listing')}</p>
    )
  }

  if (skill.status !== 'available') {
    return (
      <p className="text-center text-sm text-gray-400 py-2">
        {t('skill_unavailable')}
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: CreateRequestBody = {
      skillId: skill.id,
      scheduledStart: new Date(form.get('scheduledStart') as string).toISOString(),
      scheduledEnd: new Date(form.get('scheduledEnd') as string).toISOString(),
      meetingType,
      meetingUrl: meetingType !== 'in_person' ? (form.get('meetingUrl') as string) || undefined : undefined,
      notes: (form.get('notes') as string) || undefined,
    }

    try {
      await createRequest.mutateAsync(body)
      setStep('success')
      try {
        const format = meetingType === 'in_person' ? 'in-person' : meetingType === 'online' ? 'online' : 'hybrid'
        posthog.capture('skill_request_created', { format })
      } catch {
        // ignore analytics errors
      }
    } catch {
      // error surfaced via createRequest.error
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setStep('form'); createRequest.reset() }}
        className="w-full bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
      >
        {t('request_skill_btn')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-dialog-title"
            aria-describedby="request-dialog-description"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-6 shadow-xl"
          >
            {step === 'success' ? (
              <div className="text-center py-4">
                <h2 className="text-lg font-semibold mb-2 text-green-700">{t('request_sent_title')}</h2>
                <p className="text-sm text-gray-600 mb-5">
                  {t('request_sent_desc')}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/my-requests"
                    onClick={() => setOpen(false)}
                    className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
                  >
                    {t('view_requests')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {tCommon('close')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 id="request-dialog-title" className="text-lg font-semibold">{t('request_skill_btn')}</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('close_dialog_label')}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <p id="request-dialog-description" className="sr-only">
                  {t('request_sr_desc')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="request-start" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('request_start_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={startInputRef}
                        id="request-start"
                        name="scheduledStart"
                        type="datetime-local"
                        required
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="request-end" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('request_end_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="request-end"
                        name="scheduledEnd"
                        type="datetime-local"
                        required
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="request-meeting-type" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('request_meeting_type_label')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="request-meeting-type"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as typeof meetingType)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="in_person">{t('meeting_in_person')}</option>
                      <option value="online">{t('meeting_online')}</option>
                      <option value="hybrid">{t('meeting_hybrid')}</option>
                    </select>
                  </div>

                  {meetingType !== 'in_person' && (
                    <div>
                      <label htmlFor="request-meeting-url" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('request_url_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="request-meeting-url"
                        name="meetingUrl"
                        type="url"
                        required
                        placeholder="https://meet.google.com/…"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="request-notes" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('request_notes_label')} <span className="text-gray-400 font-normal">{t('request_notes_optional')}</span>
                    </label>
                    <textarea
                      id="request-notes"
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      placeholder={t('request_notes_placeholder')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  {createRequest.error && (
                    <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {createRequest.error.message}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={createRequest.isPending}
                      className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
                    >
                      {createRequest.isPending ? t('sending') : t('send_request')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {tCommon('cancel')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
