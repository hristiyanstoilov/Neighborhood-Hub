'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvpStatus)
  const [busy, setBusy] = useState(false)

  if (loading) return null

  if (!user) {
    return (
      <Link
        href={`/login?next=/events/${eventId}`}
        className="block w-full text-center bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
      >
        Log in to RSVP
      </Link>
    )
  }

  if (user.id === organizerId) {
    return <p className="text-center text-sm text-gray-400 py-2">You are the organiser of this event.</p>
  }

  if (status === 'cancelled') {
    return <p className="text-center text-sm text-gray-400 py-2">This event has been cancelled.</p>
  }

  if (status === 'completed') {
    return <p className="text-center text-sm text-gray-400 py-2">This event has already taken place.</p>
  }

  async function handleRsvp() {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          EVENT_FULL: 'This event is full.',
          EVENT_NOT_OPEN: 'This event is no longer accepting RSVPs.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        }
        showToast({ variant: 'error', title: 'RSVP failed', message: msg[json.error] ?? 'Something went wrong.' })
        return
      }
      setRsvpStatus('attending')
      showToast({ variant: 'success', title: "You're going!", message: 'Your RSVP has been confirmed.' })
    } catch {
      showToast({ variant: 'error', title: 'Network error', message: 'Please check your connection.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE' })
      if (!res.ok) {
        showToast({ variant: 'error', title: 'Could not cancel', message: 'Please try again.' })
        return
      }
      setRsvpStatus('cancelled')
      showToast({ variant: 'success', title: 'RSVP cancelled', message: "You've cancelled your attendance." })
    } catch {
      showToast({ variant: 'error', title: 'Network error', message: 'Please check your connection.' })
    } finally {
      setBusy(false)
    }
  }

  if (rsvpStatus === 'attending') {
    return (
      <div className="space-y-2">
        <p className="text-center text-sm font-medium text-green-700 py-1">
          ✓ You are attending this event
        </p>
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="w-full border border-gray-300 text-gray-600 rounded-md py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Cancelling…' : 'Cancel my RSVP'}
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
      {busy ? 'Saving…' : rsvpStatus === 'cancelled' ? 'Re-RSVP to this event' : 'RSVP to this event'}
    </button>
  )
}
