'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface Profile {
  name: string | null
  bio: string | null
  avatarUrl: string | null
  locationId: string | null
  isPublic: boolean
}

interface Location { id: string; city: string; neighborhood: string }

interface Props {
  profile: Profile | null
  locations: Location[]
}

export default function EditProfileForm({ profile, locations }: Props) {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)

  async function uploadAvatar(file: File) {
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

      setAvatarUrl(json.data.url)
      setPendingAvatarFile(null)
      return true
    } catch {
      setUploadError('Upload failed. Please try again.')
      return false
    } finally {
      setUploading(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingAvatarFile(file)
    await uploadAvatar(file)
  }

  async function retryAvatarUpload() {
    if (!pendingAvatarFile) return
    await uploadAvatar(pendingAvatarFile)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const body = {
        name:       (form.get('name') as string).trim() || undefined,
        bio:        (form.get('bio') as string).trim() || undefined,
        avatarUrl:  avatarUrl || undefined,
        locationId: (form.get('locationId') as string) || undefined,
        isPublic:   form.get('isPublic') === 'true',
      }

      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          VALIDATION_ERROR:   'Please check your inputs.',
          LOCATION_NOT_FOUND: 'Selected location is invalid.',
          TOO_MANY_REQUESTS:  'Too many attempts. Please wait and try again.',
        }
        setSubmitError(msg[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      // Refresh auth context so nav shows the updated name
      await refreshUser()
      showToast({
        variant: 'success',
        title: 'Profile saved',
        message: 'Your profile details were updated successfully.',
      })
      router.push('/profile')
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
          <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="profile-name"
            name="name"
            type="text"
            maxLength={100}
            defaultValue={profile?.name ?? ''}
            placeholder="Your display name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile?.bio ?? ''}
            placeholder="A short description about yourself…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Max 500 characters.</p>
        </div>

        <div>
          <label htmlFor="profile-avatar" className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt="Avatar preview"
              width={64}
              height={64}
              unoptimized
              className="w-16 h-16 rounded-full object-cover mb-2 border border-gray-200"
            />
          )}
          <input
            id="profile-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG or WebP, max 5 MB.</p>
          {uploadError && (
            <p role="alert" aria-live="assertive" className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}
          {uploadError && pendingAvatarFile && (
            <button
              type="button"
              onClick={() => void retryAvatarUpload()}
              disabled={uploading}
              className="mt-2 text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
            >
              Retry upload
            </button>
          )}
        </div>

        <div>
          <label htmlFor="profile-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            id="profile-location"
            name="locationId"
            defaultValue={profile?.locationId ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">— Select location —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="profile-visibility" className="block text-sm font-medium text-gray-700 mb-1">Profile visibility</label>
          <select
            id="profile-visibility"
            name="isPublic"
            defaultValue={profile?.isPublic === false ? 'false' : 'true'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
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
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
