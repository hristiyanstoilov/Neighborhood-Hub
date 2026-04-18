'use client'

import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toIsoStringFromLocalInput } from '@/lib/format'

type LocationOption = { id: string; city: string; neighborhood: string }

export default function NewFoodForm({ locations }: { locations: LocationOption[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [locationId, setLocationId] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
      router.push(`/food/${json.data.id}`)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      const message: Record<string, string> = {
        VALIDATION_ERROR: 'Please check the form fields.',
        UNVERIFIED_EMAIL: 'Please verify your email before sharing food.',
      }
      setError(message[code] ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Share Food</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Field label="Title" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" placeholder="e.g. Homemade lentil soup" maxLength={200} required />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-28" maxLength={5000} placeholder="What are you sharing, how much, and any allergies?" />
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
          <textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white min-h-24" maxLength={500} placeholder="Entry code, contact preferences, pickup timing..." />
        </Field>
        <Field label="Image URL">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white" placeholder="https://..." maxLength={2048} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/food')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-green-700 text-white py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Create listing'}</button>
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