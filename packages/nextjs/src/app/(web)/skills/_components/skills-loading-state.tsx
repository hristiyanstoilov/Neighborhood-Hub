export function SkillsLoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      <div className="h-64 rounded-lg border border-gray-200 bg-white animate-pulse" />
      <div className="h-64 rounded-lg border border-gray-200 bg-white animate-pulse" />
      <div className="h-64 rounded-lg border border-gray-200 bg-white animate-pulse" />
    </div>
  )
}
