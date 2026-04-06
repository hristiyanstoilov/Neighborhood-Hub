'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface Props {
  skillId: string
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:      'You must be logged in.',
  FORBIDDEN:         'You do not have permission to delete this skill.',
  NOT_FOUND:         'Skill not found.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
}

export default function SkillOwnerActions({ skillId }: Props) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await apiFetch(`/api/skills/${skillId}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        setDeleteError(ERROR_MESSAGES[json.error] ?? 'Could not delete skill. Please try again.')
        setConfirmDelete(false)
        return
      }

      router.push('/skills')
    } catch {
      setDeleteError('Network error. Please check your connection and try again.')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Link
        href={`/skills/${skillId}/edit`}
        className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Edit
      </Link>

      {!confirmDelete ? (
        <button
          onClick={() => { setConfirmDelete(true); setDeleteError(null) }}
          className="px-4 py-1.5 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      ) : (
        <>
          <span className="text-sm text-gray-600">Are you sure?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </>
      )}

      {deleteError && (
        <p className="text-sm text-red-600">{deleteError}</p>
      )}
    </div>
  )
}
