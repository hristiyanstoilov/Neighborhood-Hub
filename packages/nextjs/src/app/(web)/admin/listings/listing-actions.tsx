'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'

type ListingType = 'skill' | 'tool' | 'event' | 'drive' | 'food'

interface Props {
  id: string
  type: ListingType
  title: string
}

export function ListingActions({ id, type, title }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setConfirm(false)
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/listings', {
        method: 'DELETE',
        body: JSON.stringify({ type, id }),
      })
      if (!res.ok) throw new Error()
      showToast({ variant: 'success', title: 'Deleted', message: `"${title}" has been removed.` })
      router.refresh()
    } catch {
      showToast({ variant: 'error', title: 'Error', message: 'Could not delete listing.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={confirm}
        title="Delete listing?"
        description={`"${title}" will be soft-deleted and hidden from all users.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        busy={loading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirm(false)}
      />
      <button
        onClick={() => setConfirm(true)}
        disabled={loading}
        className="text-xs px-2.5 py-1 rounded-md font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {loading ? '…' : 'Delete'}
      </button>
    </>
  )
}
