'use client'

import { useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'

type Props = {
  value: string
  onChange: (url: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setUploadError(json?.detail ?? 'Upload failed. Only JPEG, PNG, WebP up to 5 MB.')
        return
      }
      onChange(json.data.url)
    } catch {
      setUploadError('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="Preview"
            className="w-full max-h-52 object-cover rounded-md border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-green-700 hover:underline disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Replace image'}
            </button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-500">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-md px-3 py-4 text-sm text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Upload image'}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste an image URL…"
            maxLength={2048}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
          />
        </div>
      )}

      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
    </div>
  )
}
