type RequestAction = 'accept' | 'reject' | 'complete' | 'cancel'

type RequestActionsProps = {
  status: string
  isOwner: boolean
  isRequester: boolean
  terminalStatuses: string[]
  loading: boolean
  onAction: (action: RequestAction) => void
  onOpenCancelPrompt: () => void
}

export function RequestActions({
  status,
  isOwner,
  isRequester,
  terminalStatuses,
  loading,
  onAction,
  onOpenCancelPrompt,
}: RequestActionsProps) {
  if (terminalStatuses.includes(status)) {
    return null
  }

  const canCancel = (isRequester && status === 'pending') || ((isRequester || isOwner) && status === 'accepted')

  return (
    <div className="flex flex-wrap gap-2">
      {isOwner && status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => onAction('accept')}
            disabled={loading}
            className="bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onAction('reject')}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </>
      )}

      {isRequester && status === 'accepted' && (
        <button
          type="button"
          onClick={() => onAction('complete')}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Mark complete
        </button>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={onOpenCancelPrompt}
          disabled={loading}
          className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
