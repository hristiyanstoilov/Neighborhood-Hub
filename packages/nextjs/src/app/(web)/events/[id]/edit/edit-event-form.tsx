'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ImageUpload } from '@/components/ui/image-upload'

interface EventData {
  id:          string
  title:       string
  description: string | null
  address:     string | null
  startsAt:    string
  endsAt:      string | null
  maxCapacity: number | null
  status:      string
  imageUrl:    string | null
}

interface Props {
  event: EventData
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function EditEventForm({ event }: Props) {
  const router = useRouter()
  const t = useTranslations('events')
  const tCommon = useTranslations('common')
  const { showToast } = useToast()
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [imageUrl, setImageUrl]       = useState(event.imageUrl ?? '')
  const [titleLength, setTitleLength] = useState(event.title?.length ?? 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const startsAt = form.get('startsAt') as string
      const endsAt   = form.get('endsAt') as string

      if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
        setError(t('errors.end_before_start'))
        setLoading(false)
        return
      }

      const maxCapacityRaw = form.get('maxCapacity') as string
      const body = {
        title:       form.get('title') as string,
        description: (form.get('description') as string) || undefined,
        address:     (form.get('address') as string) || undefined,
        startsAt:    new Date(startsAt).toISOString(),
        endsAt:      endsAt ? new Date(endsAt).toISOString() : null,
        maxCapacity: maxCapacityRaw ? parseInt(maxCapacityRaw, 10) : null,
        status:      form.get('status') as string,
        imageUrl:    imageUrl || null,
      }

      const res = await apiFetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNAUTHORIZED:      t('errors.unauthorized'),
          FORBIDDEN:         t('errors.forbidden'),
          NOT_FOUND:         t('errors.not_found'),
          VALIDATION_ERROR:  t('errors.validation'),
          TOO_MANY_REQUESTS: t('errors.too_many_requests'),
        }
        setError(msg[json.error] ?? t('errors.unexpected'))
        return
      }

      showToast({
        variant: 'success',
        title: t('toast_saved_title'),
        message: t('toast_saved_message'),
      })
      router.push(`/events/${event.id}`)
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="edit-event-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_title_label')} <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-event-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            defaultValue={event.title}
            onChange={(e) => setTitleLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div>
          <label htmlFor="edit-event-status" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_status_label')}
          </label>
          <select
            id="edit-event-status"
            name="status"
            defaultValue={event.status}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="published">{t('status_published')}</option>
            <option value="cancelled">{t('status_cancelled')}</option>
            <option value="completed">{t('status_completed')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="edit-event-description" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_desc_label')}
          </label>
          <textarea
            id="edit-event-description"
            name="description"
            rows={4}
            maxLength={5000}
            defaultValue={event.description ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_image_label')}</label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-event-starts" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form_starts_label')} <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-event-starts"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(event.startsAt)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="edit-event-ends" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form_ends_label')} <span className="text-gray-400 font-normal">{t('form_ends_optional')}</span>
            </label>
            <input
              id="edit-event-ends"
              name="endsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(event.endsAt)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-event-address" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_address_label')} <span className="text-gray-400 font-normal">{t('form_address_optional')}</span>
          </label>
          <input
            id="edit-event-address"
            name="address"
            type="text"
            maxLength={300}
            defaultValue={event.address ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('form_address_placeholder')}
          />
        </div>

        <div className="w-40">
          <label htmlFor="edit-event-capacity" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_capacity_label')} <span className="text-gray-400 font-normal">{t('form_capacity_optional')}</span>
          </label>
          <input
            id="edit-event-capacity"
            name="maxCapacity"
            type="number"
            min={1}
            defaultValue={event.maxCapacity ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('form_capacity_placeholder')}
          />
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('form_saving') : t('form_save')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/events/${event.id}`)}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
