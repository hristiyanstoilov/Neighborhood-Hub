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

export default function NewToolForm({ categories, locations }: Props) {
  const router = useRouter()
  const t = useTranslations('tools')
  const tCommon = useTranslations('common')
  const { showToast } = useToast()
  const [loading, setLoading]           = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [uploadError, setUploadError]   = useState<string | null>(null)
  const [imageUrl, setImageUrl]         = useState('')
  const [uploading, setUploading]       = useState(false)
  const [pendingFile, setPendingFile]   = useState<File | null>(null)
  const [titleLength, setTitleLength]   = useState(0)
  const [descLength, setDescLength]     = useState(0)

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
      setPendingFile(null)
      return true
    } catch {
      setUploadError('Upload failed. Please try again.')
      return false
    } finally {
      setUploading(false)
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
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
      const body = {
        title:       form.get('title') as string,
        description: (form.get('description') as string) || undefined,
        categoryId:  (form.get('categoryId') as string) || undefined,
        locationId:  (form.get('locationId') as string) || undefined,
        condition:   (form.get('condition') as string) || undefined,
        imageUrl:    imageUrl || undefined,
      }

      const res = await apiFetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        title: t('toast_listed_title'),
        message: t('toast_listed_message'),
      })
      router.push(`/tools/${json.data.id}`)
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
          <label htmlFor="tool-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_title_label')} <span className="text-red-500">*</span>
          </label>
          <input
            id="tool-title"
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
          <label htmlFor="tool-description" className="block text-sm font-medium text-gray-700 mb-1">{t('form_desc_label')}</label>
          <textarea
            id="tool-description"
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
          <label htmlFor="tool-image" className="block text-sm font-medium text-gray-700 mb-1">{t('form_image_label')}</label>
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
            id="tool-image"
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
          {uploadError && pendingFile && (
            <button
              type="button"
              onClick={() => void uploadImage(pendingFile)}
              disabled={uploading}
              className="mt-2 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
            >
              {t('form_retry_upload')}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tool-condition" className="block text-sm font-medium text-gray-700 mb-1">{t('form_condition_label')}</label>
            <select
              id="tool-condition"
              name="condition"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_select_placeholder')}</option>
              {[
                { value: 'new',  label: t('condition_new') },
                { value: 'good', label: t('condition_good') },
                { value: 'fair', label: t('condition_fair') },
                { value: 'worn', label: t('condition_worn') },
              ].map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tool-category" className="block text-sm font-medium text-gray-700 mb-1">{t('form_category_label')}</label>
            <select
              id="tool-category"
              name="categoryId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_select_placeholder')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tool-location" className="block text-sm font-medium text-gray-700 mb-1">{t('form_location_label')}</label>
            <select
              id="tool-location"
              name="locationId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_select_placeholder')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
              ))}
            </select>
          </div>
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
            {loading ? t('form_listing') : t('form_list')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/tools')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
