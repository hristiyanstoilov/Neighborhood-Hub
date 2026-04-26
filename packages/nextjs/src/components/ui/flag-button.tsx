'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

type EntityType = 'skill' | 'tool' | 'food_share' | 'event' | 'community_drive'
type Reason = 'spam' | 'inappropriate' | 'misleading' | 'other'

const REASONS: { value: Reason; label: string }[] = [
  { value: 'spam',          label: 'Spam or advertising' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misleading',    label: 'Misleading information' },
  { value: 'other',         label: 'Other' },
]

interface FlagButtonProps {
  entityType: EntityType
  entityId: string
}

export function FlagButton({ entityType, entityId }: FlagButtonProps) {
  const { showToast } = useToast()
  const [open, setOpen]         = useState(false)
  const [reason, setReason]     = useState<Reason>('spam')
  const [loading, setLoading]   = useState(false)
  const [reported, setReported] = useState(false)

  const titleId      = useId()
  const panelRef     = useRef<HTMLDivElement>(null)
  const returnFocRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnFocRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) { e.preventDefault(); setOpen(false) }
      if (e.key !== 'Tab' || !panelRef.current) return
      const els = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
      if (!els.length) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      returnFocRef.current?.focus()
      returnFocRef.current = null
    }
  }, [open, loading])

  async function submit() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, reason }),
      })
      if (res.status === 409) {
        showToast({ variant: 'info', title: 'Already reported', message: 'You have already flagged this content.' })
        setReported(true)
        setOpen(false)
        return
      }
      if (!res.ok) throw new Error()
      setReported(true)
      setOpen(false)
      showToast({ variant: 'success', title: 'Report submitted', message: 'Thank you. Our team will review this content.' })
    } catch {
      showToast({ variant: 'error', title: 'Failed to report', message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={reported}
        title={reported ? 'Reported' : 'Flag this content'}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-default transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M3 2a.75.75 0 0 1 .75.75V13.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 3 2Zm1.5 1.5v5.5l7.5-2.75L4.5 3.5Z" />
        </svg>
        {reported ? 'Reported' : 'Report'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : () => setOpen(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-xl p-5"
          >
            <h3 id={titleId} className="text-base font-semibold text-gray-900 mb-3">Report this content</h3>
            <fieldset className="space-y-2">
              <legend className="sr-only">Reason for report</legend>
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="flag-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </fieldset>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
