'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteSkill } from './_hooks/use-delete-skill'

interface Props {
  skillId: string
}

export default function SkillOwnerActions({ skillId }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteSkill(skillId)

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
        onClick={() => { setConfirmDelete(true); deleteMutation.reset() }}
        className="px-4 py-1.5 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>

      {deleteMutation.error && (
        <p className="text-sm text-red-600">{deleteMutation.error.message}</p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete skill?"
        description="This will permanently remove the skill listing from the marketplace."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmVariant="danger"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => { setConfirmDelete(false); deleteMutation.reset() }}
        busy={deleteMutation.isPending}
      />
    </div>
  )
}
