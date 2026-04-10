'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { SkillRequestRow } from '@/lib/queries/skill-requests'
import { useToast } from '@/components/ui/toast'
import { formatDateTime, formatMeetingType, formatRequestStatus } from '@/lib/format'

interface Props {
  request: SkillRequestRow
  viewerId: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function RequestCard({ request, viewerId }: Props) {
  const [status, setStatus] = useState(request.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelPrompt, setCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const { showToast } = useToast()

  const isOwner = request.userToId === viewerId
  const isRequester = request.userFromId === viewerId
  const otherName = isOwner ? request.requesterName : request.ownerName
  const TERMINAL = ['rejected', 'completed', 'cancelled']

  async function handleAction(action: 'accept' | 'reject' | 'complete' | 'cancel') {
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, string> = { action }
      if (action === 'cancel') body.cancellationReason = cancelReason

      const res = await apiFetch(`/api/skill-requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          FORBIDDEN: 'You are not allowed to perform this action.',
          INVALID_TRANSITION: 'This action is no longer available.',
          REQUEST_ALREADY_TERMINAL: 'This request is already closed.',
          TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
        }
        setError(msgs[json.error] ?? 'Something went wrong.')
        return
      }

      setStatus(json.data.status)
      setCancelPrompt(false)
      setCancelReason('')
      showToast({
        variant: 'success',
        title: 'Request updated',
        message: `The request is now ${json.data.status}.`,
      })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link
            href={`/skills/${request.skillId}`}
            className="font-semibold text-gray-900 hover:text-green-700 transition-colors"
          >
            {request.skillTitle}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">
            {isOwner ? 'From' : 'To'}: {otherName ?? 'Unknown user'}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.cancelled}`}>
          {formatRequestStatus(status)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4">
        <div>
          <dt className="text-gray-400 text-xs">Start</dt>
          <dd className="text-gray-700">{formatDateTime(request.scheduledStart)}</dd>
        </div>
        <div>
          <dt className="text-gray-400 text-xs">End</dt>
          <dd className="text-gray-700">{formatDateTime(request.scheduledEnd)}</dd>
        </div>
        <div>
          <dt className="text-gray-400 text-xs">Meeting</dt>
          <dd className="text-gray-700">{formatMeetingType(request.meetingType)}</dd>
        </div>
        {request.meetingUrl && (
          <div>
            <dt className="text-gray-400 text-xs">Link</dt>
            <dd>
              <a
                href={request.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline text-sm truncate block max-w-[180px]"
              >
                Open link
              </a>
            </dd>
          </div>
        )}
      </dl>

      {request.notes && (
        <p className="text-sm text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-3">
          {request.notes}
        </p>
      )}

      {request.cancellationReason && (
        <p className="text-sm text-red-500 mb-3">
          Cancellation reason: {request.cancellationReason}
        </p>
      )}

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Action buttons */}
      {!TERMINAL.includes(status) && (
        <div className="flex flex-wrap gap-2">
          {isOwner && status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {(status === 'accepted') && (
            <button
              type="button"
              onClick={() => handleAction('complete')}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Mark complete
            </button>
          )}

          {(isRequester && status === 'pending') || status === 'accepted' ? (
            <button
              type="button"
              onClick={() => setCancelPrompt(true)}
              disabled={loading}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}

      {/* Cancellation reason prompt */}
      {cancelPrompt && (
        <div className="mt-3 space-y-2">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Please provide a reason for cancelling…"
            aria-label="Cancellation reason"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAction('cancel')}
              disabled={loading || !cancelReason.trim()}
              className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Confirm cancel
            </button>
            <button
              type="button"
              onClick={() => { setCancelPrompt(false); setCancelReason('') }}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
