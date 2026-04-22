'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function NewDriveForm() {
  const router = useRouter()
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
      setSubmitError('Please wait for the image to finish uploading.')
      return
    }
    setSubmitError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const deadline = form.get('deadline') as string

      const body = {
        title:           form.get('title') as string,
        description:     (form.get('description') as string) || undefined,
        driveType:       form.get('driveType') as string,
        goalDescription: (form.get('goalDescription') as string) || undefined,
        dropOffAddress:  (form.get('dropOffAddress') as string) || undefined,
        deadline:        deadline ? new Date(deadline).toISOString() : undefined,
        imageUrl:        imageUrl || undefined,
      }

      const res = await apiFetch('/api/drives', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNVERIFIED_EMAIL:  'Please verify your email before starting a drive.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
          VALIDATION_ERROR:  'Please check your inputs.',
          UNAUTHORIZED:      'You must be logged in to start a drive.',
        }
        setSubmitError(msg[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      showToast({ variant: 'success', title: 'Drive started!', message: 'Your community drive is now live.' })
      router.push(`/drives/${json.data.id}`)
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
          <label htmlFor="drive-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="drive-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            onChange={(e) => setTitleLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Winter coat collection, Food bank drive…"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div>
          <label htmlFor="drive-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="drive-type"
            name="driveType"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            defaultValue=""
          >
            <option value="" disabled>— Select type —</option>
            <option value="items">Items</option>
            <option value="food">Food</option>
            <option value="money">Money</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="drive-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="drive-description"
            name="description"
            rows={3}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Tell the community about this drive and why it matters…"
          />
        </div>

        <div>
          <label htmlFor="drive-image" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Drive image preview"
              width={1200}
              height={600}
              unoptimized
              className="w-full max-h-48 object-cover rounded-md mb-2 border border-gray-200"
            />
          )}
          <input
            id="drive-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={uploading}
            className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
          <p className="text-xs text-gray-400 mt-1">Optional. JPEG, PNG or WebP, max 5 MB.</p>
          {uploadError && <p role="alert" className="mt-1 text-xs text-red-600">{uploadError}</p>}
          {uploadError && pendingImageFile && (
            <button type="button" onClick={() => void uploadImage(pendingImageFile)} disabled={uploading}
              className="mt-1 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50">
              Retry upload
            </button>
          )}
        </div>

        <div>
          <label htmlFor="drive-goal" className="block text-sm font-medium text-gray-700 mb-1">
            Goal <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="drive-goal"
            name="goalDescription"
            type="text"
            maxLength={500}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Collect 100 winter coats for families in need"
          />
        </div>

        <div>
          <label htmlFor="drive-address" className="block text-sm font-medium text-gray-700 mb-1">
            Drop-off address <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="drive-address"
            name="dropOffAddress"
            type="text"
            maxLength={300}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Where should people drop off contributions?"
          />
        </div>

        <div className="w-48">
          <label htmlFor="drive-deadline" className="block text-sm font-medium text-gray-700 mb-1">
            Deadline <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="drive-deadline"
            name="deadline"
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            {loading ? 'Starting…' : 'Start drive'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/drives')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
