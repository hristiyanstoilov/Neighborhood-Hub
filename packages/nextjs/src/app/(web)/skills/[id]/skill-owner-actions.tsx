'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'

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
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { showToast } = useToast()

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await apiFetch(`/api/skills/${skillId}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        setDeleteError(ERROR_MESSAGES[json.error] ?? 'Could not delete skill. Please try again.')
        return
      }

      showToast({
        variant: 'success',
        title: 'Skill deleted',
        message: 'The skill listing was removed successfully.',
      })
      router.push('/skills')
    } catch {
      setDeleteError('Network error. Please check your connection and try again.')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
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

      <button
        type="button"
        onClick={() => { setConfirmDelete(true); setDeleteError(null) }}
        className="px-4 py-1.5 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>

      {deleteError && (
        <p className="text-sm text-red-600">{deleteError}</p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete skill?"
        description="This will permanently remove the skill listing from the marketplace."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteError(null) }}
        busy={deleting}
      />
    </div>
  )
}
