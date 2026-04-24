'use client'

import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { formatDateTimeLocalInput, toIsoStringFromLocalInput } from '@/lib/format'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageUpload } from '@/components/ui/image-upload'

type LocationOption = { id: string; city: string; neighborhood: string }

type FoodShare = {
  id: string
  title: string
  description: string | null
  quantity: number
  locationId: string | null
  availableUntil: Date | null
  pickupInstructions: string | null
  imageUrl: string | null
}

export default function EditFoodForm({ foodShare, locations }: { foodShare: FoodShare; locations: LocationOption[] }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [title, setTitle] = useState(foodShare.title)
  const [description, setDescription] = useState(foodShare.description ?? '')
  const [quantity, setQuantity] = useState(String(foodShare.quantity))
  const [locationId, setLocationId] = useState(foodShare.locationId ?? '')
  const [availableUntil, setAvailableUntil] = useState(formatDateTimeLocalInput(foodShare.availableUntil))
  const [pickupInstructions, setPickupInstructions] = useState(foodShare.pickupInstructions ?? '')
  const [imageUrl, setImageUrl] = useState(foodShare.imageUrl ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      quantity: parseInt(quantity, 10) || 1,
      locationId: locationId || null,
      availableUntil: availableUntil ? toIsoStringFromLocalInput(availableUntil) : null,
      pickupInstructions: pickupInstructions.trim() || null,
      imageUrl: imageUrl.trim() || null,
    }

    try {
      const res = await apiFetch(`/api/food-shares/${foodShare.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      showToast({ title: 'Listing updated.', variant: 'success' })
      router.push(`/food/${json.data.id}`)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      setError(code === 'VALIDATION_ERROR' ? 'Please check the form fields.' : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function runDelete() {
    setConfirmDelete(false)
    setDeleting(true)
    setError('')
    try {
      const res = await apiFetch(`/api/food-shares/${foodShare.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      showToast({ title: 'Listing deleted.', variant: 'success' })
      router.push('/food')
    } catch {
      setError('Could not delete this listing.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
    <ConfirmDialog
      open={confirmDelete}
      title="Delete listing?"
      description="This will permanently remove the food listing."
      confirmLabel="Delete"
      confirmVariant="danger"
      busy={deleting}
      onConfirm={() => void runDelete()}
      onCancel={() => setConfirmDelete(false)}
    />
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Food Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Field label="Title" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" maxLength={200} required />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-28" maxLength={5000} />
        </Field>
        <Field label="Quantity" required>
          <input type="number" min={1} max={1000} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full max-w-40 border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" required />
        </Field>
        <Field label="Neighborhood">
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white">
            <option value="">Select a location (optional)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.neighborhood}, {loc.city}</option>
            ))}
          </select>
        </Field>
        <Field label="Available until">
          <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" />
        </Field>
        <Field label="Pickup instructions">
          <textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-24" maxLength={500} />
        </Field>
        <Field label="Image">
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push(`/food/${foodShare.id}`)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-green-700 text-white py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>

        <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} className="w-full border border-red-300 text-red-600 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete listing'}</button>
      </form>

    </div>
    </>
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