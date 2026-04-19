type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-gray-200/80 ${className}`} />
}

function SkillCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Skeleton className="h-36 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
    </div>
  )
}

function RequestCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}

function ProfileCardSkeleton() {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

function RadarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      <div className="w-56 shrink-0 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-64 rounded-md" />
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-6 w-1/2 rounded-md" />
        </div>
        <div className="flex-1 space-y-3 pt-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className={`h-12 rounded-lg ${index % 2 === 0 ? 'w-3/4' : 'w-1/2 ml-auto'}`} />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}

function GenericCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
      <Skeleton className="h-3 w-24 rounded-md" />
    </div>
  )
}

export function ListPageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}
      <div className="space-y-3 mb-6">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <GenericCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function SkillsPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="space-y-4 mb-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-10 w-3/4 rounded-xl" />
      </div>

      <div className="mb-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkillCardSkeleton key={index} />
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  )
}

export function RequestsPageSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6 space-y-4">
        <Skeleton className="h-8 w-44 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <RequestCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
  return <ProfileCardSkeleton />
}

export function RadarPageSkeleton() {
  return <RadarSkeleton />
}

export function ChatPageSkeleton() {
  return <ChatSkeleton />
}