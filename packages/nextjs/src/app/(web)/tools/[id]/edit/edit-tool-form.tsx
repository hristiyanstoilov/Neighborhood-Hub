'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface ToolData {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  locationId: string | null
  condition: string | null
  status: string
}

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

interface Props {
  tool: ToolData
  categories: Category[]
  locations: Location[]
}

const CONDITIONS = [
  { value: 'new',  label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
]

export default function EditToolForm({ tool, categories, locations }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [titleLength, setTitleLength] = useState(tool.title?.length ?? 0)
  const [descLength, setDescLength]   = useState(tool.description?.length ?? 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const body = {
        title:       form.get('title') as string,
        description: (form.get('description') as string) || undefined,
        categoryId:  (form.get('categoryId') as string) || undefined,
        locationId:  (form.get('locationId') as string) || undefined,
        condition:   (form.get('condition') as string) || undefined,
        status:      form.get('status') as string,
      }

      const res = await apiFetch(`/api/tools/${tool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNAUTHORIZED:       'You must be logged in.',
          FORBIDDEN:          'You do not have permission to edit this tool.',
          NOT_FOUND:          'Tool not found.',
          VALIDATION_ERROR:   'Please check your inputs.',
          CATEGORY_NOT_FOUND: 'Selected category is invalid.',
          LOCATION_NOT_FOUND: 'Selected location is invalid.',
          TOO_MANY_REQUESTS:  'Too many attempts. Please wait and try again.',
        }
        setError(msg[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      showToast({
        variant: 'success',
        title: 'Tool updated',
        message: 'Your changes were saved successfully.',
      })
      router.push(`/tools/${tool.id}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="edit-tool-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-tool-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            defaultValue={tool.title}
            onChange={(e) => setTitleLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-tool-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="edit-tool-status"
              name="status"
              defaultValue={tool.status}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="available">Available</option>
              <option value="in_use">In use</option>
              <option value="on_loan">On loan</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-tool-condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              id="edit-tool-condition"
              name="condition"
              defaultValue={tool.condition ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">— Select —</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="edit-tool-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="edit-tool-description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={tool.description ?? ''}
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{descLength}/2000</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-tool-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="edit-tool-category"
              name="categoryId"
              defaultValue={tool.categoryId ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-tool-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              id="edit-tool-location"
              name="locationId"
              defaultValue={tool.locationId ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">— Select location —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
              ))}
            </select>
          </div>
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
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/tools/${tool.id}`)}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
