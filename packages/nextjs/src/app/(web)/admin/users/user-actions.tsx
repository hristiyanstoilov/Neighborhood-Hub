'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Props {
  userId: string
  currentRole: string
  isLocked: boolean
}

type Action = 'lock' | 'unlock' | 'promote' | 'demote' | 'delete'

const ACTION_LABELS: Record<Action, string> = {
  lock:    'Lock',
  unlock:  'Unlock',
  promote: 'Make admin',
  demote:  'Remove admin',
  delete:  'Delete',
}

const CONFIRM_ACTIONS: Action[] = ['promote', 'demote', 'delete']

export default function UserActions({ userId, currentRole, isLocked }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Action | null>(null)

  const actions: Action[] = [
    isLocked ? 'unlock' : 'lock',
    currentRole === 'admin' ? 'demote' : 'promote',
    'delete',
  ]

  async function execute(action: Action) {
    setError(null)
    setLoading(action)
    setConfirm(null)

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })

      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          FORBIDDEN:         'You cannot perform this action on yourself.',
          NOT_FOUND:         'User not found.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        }
        setError(msgs[json.error] ?? 'Something went wrong.')
        return
      }

      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  function handleClick(action: Action) {
    if (CONFIRM_ACTIONS.includes(action)) {
      setConfirm(action)
    } else {
      execute(action)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => handleClick(action)}
          disabled={loading !== null}
          className={`text-xs px-2.5 py-1 rounded-md font-medium disabled:opacity-50 transition-colors ${
            action === 'delete'
              ? 'text-red-600 border border-red-200 hover:bg-red-50'
              : action === 'lock'
              ? 'text-orange-600 border border-orange-200 hover:bg-orange-50'
              : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {loading === action ? '…' : ACTION_LABELS[action]}
        </button>
      ))}

      {error && (
        <p className="w-full text-xs text-red-600 mt-1">{error}</p>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'delete' ? 'Delete user?' : confirm ? `${ACTION_LABELS[confirm]}?` : 'Confirm action'}
        description={
          confirm === 'delete'
            ? 'This will permanently remove the user from the admin list.'
            : confirm
            ? `Are you sure you want to ${ACTION_LABELS[confirm].toLowerCase()} this user?`
            : undefined
        }
        confirmLabel={loading === confirm ? '…' : 'Yes'}
        cancelLabel="No"
        confirmVariant={confirm === 'delete' ? 'danger' : 'primary'}
        onConfirm={() => confirm && execute(confirm)}
        onCancel={() => setConfirm(null)}
        busy={loading !== null}
      />
    </div>
  )
}
