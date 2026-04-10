'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'

interface Props {
  skill: { id: string; ownerId: string; status: string }
}

const ERROR_MESSAGES: Record<string, string> = {
  UNVERIFIED_EMAIL: 'Please verify your email before requesting a skill.',
  SKILL_NOT_AVAILABLE: 'This skill is no longer available.',
  REQUEST_ALREADY_EXISTS: 'You already have a pending or accepted request for this skill.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait and try again.',
  VALIDATION_ERROR: 'Please check the form and try again.',
}

export default function RequestButton({ skill }: Props) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetingType, setMeetingType] = useState<'in_person' | 'online' | 'hybrid'>('in_person')
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const startInputRef = useRef<HTMLInputElement>(null)

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
        Log in to request this skill
      </Link>
    )
  }

  if (user.id === skill.ownerId) {
    return (
      <p className="text-center text-sm text-gray-400 py-2">This is your skill listing.</p>
    )
  }

  if (skill.status !== 'available') {
    return (
      <p className="text-center text-sm text-gray-400 py-2">
        This skill is currently unavailable.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const form = new FormData(e.currentTarget)
      const body = {
        skillId: skill.id,
        scheduledStart: new Date(form.get('scheduledStart') as string).toISOString(),
        scheduledEnd: new Date(form.get('scheduledEnd') as string).toISOString(),
        meetingType,
        meetingUrl: meetingType !== 'in_person' ? (form.get('meetingUrl') as string) || undefined : undefined,
        notes: (form.get('notes') as string) || undefined,
      }

      const res = await apiFetch('/api/skill-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(ERROR_MESSAGES[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      setStep('success')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setStep('form'); setError(null) }}
        className="w-full bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
      >
        Request this skill
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
                <h2 className="text-lg font-semibold mb-2 text-green-700">Request sent!</h2>
                <p className="text-sm text-gray-600 mb-5">
                  The skill owner will be notified. You can track your request status below.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/my-requests"
                    onClick={() => setOpen(false)}
                    className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
                  >
                    View my requests
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 id="request-dialog-title" className="text-lg font-semibold">Request this skill</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close request dialog"
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <p id="request-dialog-description" className="sr-only">
                  Fill in the date, time, and meeting details to send a request.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="request-start" className="block text-sm font-medium text-gray-700 mb-1">
                        Start <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={startInputRef}
                        id="request-start"
                        name="scheduledStart"
                        type="datetime-local"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="request-end" className="block text-sm font-medium text-gray-700 mb-1">
                        End <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="request-end"
                        name="scheduledEnd"
                        type="datetime-local"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="request-meeting-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="request-meeting-type"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as typeof meetingType)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="in_person">In person</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  {meetingType !== 'in_person' && (
                    <div>
                      <label htmlFor="request-meeting-url" className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting URL <span className="text-red-500">*</span>
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
                      Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="request-notes"
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      placeholder="Any details or questions for the skill owner…"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  {error && (
                    <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Sending…' : 'Send request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
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
