'use client'

import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { toIsoStringFromLocalInput } from '@/lib/format'
import { useToast } from '@/components/ui/toast'
import { ImageUpload } from '@/components/ui/image-upload'
import posthog from 'posthog-js'

type LocationOption = { id: string; city: string; neighborhood: string }

export default function NewFoodForm({ locations }: { locations: LocationOption[] }) {
  const router = useRouter()
  const { showToast } = useToast()
  const t = useTranslations('food')
  const tCommon = useTranslations('common')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [locationId, setLocationId] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!safetyConfirmed) {
      setError('You must confirm the food safety acknowledgment before submitting.')
      return
    }
    setSaving(true)
    setError('')

    const body = {
      title: title.trim(),
      description: description.trim() || undefined,
      quantity: parseInt(quantity, 10) || 1,
      locationId: locationId || undefined,
      availableUntil: availableUntil ? toIsoStringFromLocalInput(availableUntil) : undefined,
      pickupInstructions: pickupInstructions.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    }

    try {
      const res = await apiFetch('/api/food-shares', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      showToast({ title: t('toast_created'), variant: 'success' })
      try {
        posthog.capture('food_share_created', {})
      } catch {
        // swallow analytics errors
      }
      router.push(`/food/${json.data.id}`)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      const message: Record<string, string> = {
        VALIDATION_ERROR: t('errors.validation_form'),
        UNVERIFIED_EMAIL: t('errors.unverified_email_create'),
      }
      setError(message[code] ?? t('errors.unexpected'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('form_title')}</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Field label={t('field_title_label')} required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" placeholder="e.g. Homemade lentil soup" maxLength={200} required />
        </Field>
        <Field label={t('field_description_label')}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-28" maxLength={5000} placeholder={t('description_placeholder')} />
        </Field>
        <Field label={t('field_quantity_label')} required>
          <input type="number" min={1} max={1000} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full max-w-40 border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" required />
        </Field>
        <Field label={t('field_neighborhood_label')}>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white">
            <option value="">{t('location_placeholder')}</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.neighborhood}, {loc.city}</option>
            ))}
          </select>
        </Field>
        <Field label={t('field_available_until_label')}>
          <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" />
        </Field>
        <Field label={t('field_pickup_instructions_label')}>
          <textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-24" maxLength={500} placeholder={t('pickup_instructions_placeholder')} />
        </Field>
        <Field label={t('field_image_url_label')}>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </Field>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <input
            id="safety-confirmed"
            type="checkbox"
            checked={safetyConfirmed}
            onChange={(e) => setSafetyConfirmed(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-green-700"
          />
          <label htmlFor="safety-confirmed" className="text-sm text-amber-900 leading-snug cursor-pointer">
            I confirm this food is safe for human consumption and has been stored correctly.
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/food')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">{tCommon('cancel')}</button>
          <button type="submit" disabled={saving || !safetyConfirmed} className="flex-1 bg-green-700 text-white py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50">{saving ? t('form_saving') : t('form_create_btn')}</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}
