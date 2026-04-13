export function RequestsLoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-24 rounded-lg border border-gray-200 bg-white animate-pulse" />
      <div className="h-24 rounded-lg border border-gray-200 bg-white animate-pulse" />
      <div className="h-24 rounded-lg border border-gray-200 bg-white animate-pulse" />
    </div>
  )
}
