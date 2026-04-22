import { cookies } from 'next/headers'
import Link from 'next/link'

import { AppIcon, type AppIconName } from '@/components/ui/app-icon'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryDrivesPage } from '@/lib/queries/drives'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Community Drives',
  description: 'Support local collection drives and help neighbors in need.',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const TYPE_LABELS: Record<string, string> = {
  items: 'Items',
  food: 'Food',
  money: 'Money',
  other: 'Other',
}

const TYPE_ICONS: Record<string, AppIconName> = {
  items: 'reservations',
  food: 'food',
  money: 'target',
  other: 'pledge',
}

const TYPE_COLORS: Record<string, string> = {
  items: 'bg-blue-50 text-blue-700',
  food: 'bg-orange-50 text-orange-700',
  money: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
}

function formatDeadline(deadline: Date | null) {
  if (!deadline) return null
  return new Date(deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function DrivesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; driveType?: string; page?: string }>
}) {
  const { status, driveType, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let drives: Awaited<ReturnType<typeof queryDrivesPage>>['drives'] = []
  let total = 0
  let isLoggedIn = false

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [drivesResult, user] = await Promise.all([
      queryDrivesPage({ status: status ?? 'open', driveType, limit: 20, page }),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    drives = drivesResult.drives
    total = drivesResult.total
    isLoggedIn = !!user
  } catch {
    // show empty state
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))
  const activeStatus = status ?? 'open'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community Drives</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} drive{total !== 1 ? 's' : ''} found
          </p>
        </div>
        {isLoggedIn && (
          <Link
            href="/drives/new"
            className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Start a drive
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {['open', 'completed', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/drives?status=${s}${driveType ? `&driveType=${driveType}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeStatus === s
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href={`/drives?status=${activeStatus}`}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !driveType ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          All types
        </Link>
        {['items', 'food', 'money', 'other'].map((type) => (
          <Link
            key={type}
            href={`/drives?status=${activeStatus}&driveType=${type}`}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              driveType === type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <AppIcon name={TYPE_ICONS[type]} size={12} />
              <span>{TYPE_LABELS[type]}</span>
            </span>
          </Link>
        ))}
      </div>

      {drives.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg mb-1">No drives here yet.</p>
          {isLoggedIn ? (
            <Link href="/drives/new" className="text-sm text-green-700 hover:underline">
              Start the first one →
            </Link>
          ) : (
            <Link href="/login?next=/drives/new" className="text-sm text-green-700 hover:underline">
              Log in to start one →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {drives.map((drive) => (
            <Link
              key={drive.id}
              href={`/drives/${drive.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">{drive.title}</h2>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[drive.driveType] ?? 'bg-gray-100 text-gray-600'}`}>
                  <span className="inline-flex items-center gap-1">
                    <AppIcon name={TYPE_ICONS[drive.driveType] ?? 'drives'} size={12} />
                    <span>{TYPE_LABELS[drive.driveType] ?? drive.driveType}</span>
                  </span>
                </span>
              </div>

              {drive.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{drive.description}</p>
              )}

              {drive.goalDescription && (
                <p className="text-xs text-gray-500 mb-2 italic">{drive.goalDescription}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>by {drive.organizerName ?? 'Anonymous'}</span>
                <div className="flex items-center gap-3">
                  {drive.deadline && <span>Deadline: {formatDeadline(drive.deadline)}</span>}
                  <span className={`px-2 py-0.5 rounded-full ${
                    drive.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : drive.status === 'cancelled'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {STATUS_LABELS[drive.status] ?? drive.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/drives?status=${activeStatus}${driveType ? `&driveType=${driveType}` : ''}&page=${page - 1}`}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/drives?status=${activeStatus}${driveType ? `&driveType=${driveType}` : ''}&page=${page + 1}`}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
