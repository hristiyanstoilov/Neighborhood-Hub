'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function NewEventForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [titleLength, setTitleLength] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const startsAt = form.get('startsAt') as string
      const endsAt   = form.get('endsAt') as string
      const maxCapacityRaw = form.get('maxCapacity') as string

      if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
        setSubmitError('End date/time must be after start date/time.')
        setLoading(false)
        return
      }

      const body = {
        title:       form.get('title') as string,
        description: (form.get('description') as string) || undefined,
        address:     (form.get('address') as string) || undefined,
        startsAt:    new Date(startsAt).toISOString(),
        endsAt:      endsAt ? new Date(endsAt).toISOString() : undefined,
        maxCapacity: maxCapacityRaw ? parseInt(maxCapacityRaw, 10) : undefined,
      }

      const res = await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNVERIFIED_EMAIL:  'Please verify your email before creating an event.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
          VALIDATION_ERROR:  'Please check your inputs.',
          UNAUTHORIZED:      'You must be logged in to create an event.',
        }
        setSubmitError(msg[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      showToast({ variant: 'success', title: 'Event created', message: 'Your event is now visible to the community.' })
      router.push(`/events/${json.data.id}`)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="event-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            onChange={(e) => setTitleLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Neighbourhood clean-up, Block party, Skills swap…"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="event-description"
            name="description"
            rows={4}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Tell people what to expect, what to bring, and any other details…"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-starts" className="block text-sm font-medium text-gray-700 mb-1">
              Starts at <span className="text-red-500">*</span>
            </label>
            <input
              id="event-starts"
              name="startsAt"
              type="datetime-local"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="event-ends" className="block text-sm font-medium text-gray-700 mb-1">
              Ends at <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="event-ends"
              name="endsAt"
              type="datetime-local"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="event-address" className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="event-address"
            name="address"
            type="text"
            maxLength={300}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Street address or venue name"
          />
        </div>

        <div className="w-40">
          <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-1">
            Max attendees <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="event-capacity"
            name="maxCapacity"
            type="number"
            min={1}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 30"
          />
        </div>

        {submitError && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/events')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
