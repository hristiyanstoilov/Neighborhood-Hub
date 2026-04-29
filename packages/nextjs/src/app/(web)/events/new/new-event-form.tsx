'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function NewEventForm() {
  const router = useRouter()
  const t = useTranslations('events')
  const tCommon = useTranslations('common')
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [titleLength, setTitleLength] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

  async function uploadImage(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.detail ?? 'Upload failed. Only JPEG, PNG, WebP up to 5 MB.')
        return false
      }
      setImageUrl(json.data.url)
      setPendingImageFile(null)
      return true
    } catch {
      setUploadError('Upload failed. Please try again.')
      return false
    } finally {
      setUploading(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImageFile(file)
    void uploadImage(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploading) {
      setSubmitError(t('form_upload_wait'))
      return
    }
    setSubmitError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const startsAt = form.get('startsAt') as string
      const endsAt   = form.get('endsAt') as string
      const maxCapacityRaw = form.get('maxCapacity') as string

      if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
        setSubmitError(t('errors.end_before_start'))
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
        imageUrl:    imageUrl || undefined,
      }

      const res = await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNVERIFIED_EMAIL:  t('errors.unverified_email'),
          TOO_MANY_REQUESTS: t('errors.too_many_requests'),
          VALIDATION_ERROR:  t('errors.validation'),
          UNAUTHORIZED:      t('errors.unauthorized'),
        }
        setSubmitError(msg[json.error] ?? t('errors.unexpected'))
        return
      }

      showToast({ variant: 'success', title: t('toast_created_title'), message: t('toast_created_message') })
      router.push(`/events/${json.data.id}`)
    } catch {
      setSubmitError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_title_label')} <span className="text-red-500">*</span>
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
            placeholder={t('form_title_placeholder')}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">{t('form_desc_label')}</label>
          <textarea
            id="event-description"
            name="description"
            rows={4}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder={t('form_desc_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="event-image" className="block text-sm font-medium text-gray-700 mb-1">{t('form_image_label')}</label>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={t('form_image_preview_alt')}
              width={1200}
              height={600}
              unoptimized
              className="w-full max-h-48 object-cover rounded-md mb-2 border border-gray-200"
            />
          )}
          <input
            id="event-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={uploading}
            className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-gray-400 mt-1">{t('form_uploading')}</p>}
          <p className="text-xs text-gray-400 mt-1">{t('form_image_hint')}</p>
          {uploadError && <p role="alert" className="mt-1 text-xs text-red-600">{uploadError}</p>}
          {uploadError && pendingImageFile && (
            <button type="button" onClick={() => void uploadImage(pendingImageFile)} disabled={uploading}
              className="mt-1 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50">
              {t('form_retry_upload')}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-starts" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form_starts_label')} <span className="text-red-500">*</span>
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
              {t('form_ends_label')} <span className="text-gray-400 font-normal">{t('form_ends_optional')}</span>
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
            {t('form_address_label')} <span className="text-gray-400 font-normal">{t('form_address_optional')}</span>
          </label>
          <input
            id="event-address"
            name="address"
            type="text"
            maxLength={300}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('form_address_placeholder')}
          />
        </div>

        <div className="w-40">
          <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_capacity_label')} <span className="text-gray-400 font-normal">{t('form_capacity_optional')}</span>
          </label>
          <input
            id="event-capacity"
            name="maxCapacity"
            type="number"
            min={1}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={t('form_capacity_placeholder')}
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
            disabled={loading || uploading}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('form_creating') : t('form_create')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/events')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
