type RequestsErrorStateProps = {
  onRetry: () => void
}

export function RequestsErrorState({ onRetry }: RequestsErrorStateProps) {
  return (
    <div className="text-center py-12 border border-red-200 bg-red-50 rounded-lg" role="alert" aria-live="assertive">
      <p className="text-sm text-red-700 mb-3">Could not load requests right now.</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  )
}
