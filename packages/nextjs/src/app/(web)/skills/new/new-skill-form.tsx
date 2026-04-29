'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

interface Props {
  categories: Category[]
  locations: Location[]
}

export default function NewSkillForm({ categories, locations }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [titleLength, setTitleLength] = useState(0)
  const [descLength, setDescLength] = useState(0)

  async function uploadImage(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.detail ?? t('errors.upload_failed'))
        return false
      }

      setImageUrl(json.data.url)
      setPendingImageFile(null)
      return true
    } catch {
      setUploadError(t('errors.upload_failed'))
      return false
    } finally {
      setUploading(false)
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImageFile(file)
    void uploadImage(file)
  }

  async function retryImageUpload() {
    if (!pendingImageFile) return
    await uploadImage(pendingImageFile)
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
      const availableHoursRaw = form.get('availableHours') as string
      const body = {
        title: form.get('title') as string,
        description: (form.get('description') as string) || undefined,
        categoryId: (form.get('categoryId') as string) || undefined,
        locationId: (form.get('locationId') as string) || undefined,
        availableHours: availableHoursRaw ? parseInt(availableHoursRaw, 10) : undefined,
        imageUrl: imageUrl || undefined,
      }

      const res = await apiFetch('/api/skills', {
        method: 'POST',
        body: JSON.stringify(body),
      })

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

      showToast({
        variant: 'success',
        title: t('toast_published_title'),
        message: t('toast_published_message'),
      })
      router.push(`/skills/${json.data.id}`)
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
          <label htmlFor="skill-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_title_label')} <span className="text-red-500">*</span>
          </label>
          <input
            id="skill-title"
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
          <label htmlFor="skill-description" className="block text-sm font-medium text-gray-700 mb-1">{t('form_desc_label')}</label>
          <textarea
            id="skill-description"
            name="description"
            rows={4}
            maxLength={2000}
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder={t('form_desc_placeholder')}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{descLength}/2000</p>
        </div>

        <div>
          <label htmlFor="skill-image" className="block text-sm font-medium text-gray-700 mb-1">{t('form_image_label')}</label>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={t('form_image_preview_alt')}
              width={1200}
              height={720}
              unoptimized
              className="w-full max-h-48 object-cover rounded-md mb-2 border border-gray-200"
            />
          )}
          <input
            id="skill-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={uploading}
            className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-gray-400 mt-1">{t('form_uploading')}</p>}
          <p className="text-xs text-gray-400 mt-1">{t('form_image_hint')}</p>
          {uploadError && (
            <p role="alert" aria-live="assertive" className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}
          {uploadError && pendingImageFile && (
            <button
              type="button"
              onClick={() => void retryImageUpload()}
              disabled={uploading}
              className="mt-2 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
            >
              {t('form_retry_upload')}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="skill-category" className="block text-sm font-medium text-gray-700 mb-1">{t('field_category')}</label>
            <select
              id="skill-category"
              name="categoryId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_category_placeholder')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skill-location" className="block text-sm font-medium text-gray-700 mb-1">{t('field_location')}</label>
            <select
              id="skill-location"
              name="locationId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_location_placeholder')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-40">
          <label htmlFor="skill-hours" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_hours_label')}
          </label>
          <input
            id="skill-hours"
            name="availableHours"
            type="number"
            min={0}
            max={168}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 5"
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
            {loading ? t('form_publishing') : t('form_publish')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/skills')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
