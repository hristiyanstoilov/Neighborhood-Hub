import { SkillCardSkeleton } from '@/components/ui/skeleton'

export function SkillsLoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkillCardSkeleton key={i} />
      ))}
    </div>
  )
}
