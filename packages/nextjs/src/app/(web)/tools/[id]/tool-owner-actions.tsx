'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDeleteTool } from './_hooks/use-delete-tool'

type ToolOwnerActionsProps = {
  toolId: string
}

export default function ToolOwnerActions({ toolId }: ToolOwnerActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteTool(toolId)

  return (
    <div className="flex gap-3 mb-4">
      <Link
        href={`/tools/${toolId}/edit`}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Edit
      </Link>

      {!confirmDelete ? (
        <button
          onClick={() => { deleteMutation.reset(); setConfirmDelete(true) }}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Delete this tool?</span>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Confirm'}
          </button>
          <button
            onClick={() => { setConfirmDelete(false); deleteMutation.reset() }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {deleteMutation.error && (
        <p className="text-sm text-red-600 self-center">{deleteMutation.error.message}</p>
      )}
    </div>
  )
}
