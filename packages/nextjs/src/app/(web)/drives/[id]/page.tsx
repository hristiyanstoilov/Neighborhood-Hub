import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryDriveById, queryDrivePledges, queryUserPledge } from '@/lib/queries/drives'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import PledgeSection from './pledge-section'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  items: 'Items',
  food:  'Food',
  money: 'Money',
  other: 'Other',
}

const STATUS_LABELS: Record<string, string> = {
  open:      'Open',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatDeadline(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function DriveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let drive = null
  let fetchError = false
  let currentUserId: string | null = null
  let userPledge: { id: string; status: string; pledgeDescription: string } | null = null
  let pledges: Awaited<ReturnType<typeof queryDrivePledges>> = []

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [driveResult, user] = await Promise.all([
      queryDriveById(id),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    drive = driveResult
    currentUserId = user?.id ?? null

    if (drive) {
      const [pledgesResult, myPledge] = await Promise.all([
        queryDrivePledges(drive.id),
        currentUserId ? queryUserPledge(drive.id, currentUserId) : Promise.resolve(null),
      ])
      pledges = pledgesResult
      userPledge = myPledge
    }
  } catch {
    fetchError = true
  }

  if (!fetchError && !drive) notFound()

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <Link href="/drives" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
          ← Back to Drives
        </Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load this drive.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link href="/drives" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
        ← Back to Drives
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold leading-snug">{drive!.title}</h1>
          <span className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
            drive!.status === 'open'
              ? 'bg-green-100 text-green-700'
              : drive!.status === 'cancelled'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {STATUS_LABELS[drive!.status] ?? drive!.status}
          </span>
        </div>

        {drive!.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{drive!.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Type</dt>
            <dd className="font-medium">{TYPE_LABELS[drive!.driveType] ?? drive!.driveType}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Organised by</dt>
            <dd className="font-medium">
              <Link href={`/users/${drive!.organizerId}`} className="hover:text-green-700 hover:underline">
                {drive!.organizerName ?? 'Anonymous'}
              </Link>
            </dd>
          </div>
          {drive!.goalDescription && (
            <div className="col-span-2">
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Goal</dt>
              <dd className="font-medium">{drive!.goalDescription}</dd>
            </div>
          )}
          {drive!.dropOffAddress && (
            <div className="col-span-2">
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Drop-off address</dt>
              <dd className="font-medium">{drive!.dropOffAddress}</dd>
            </div>
          )}
          {drive!.deadline && (
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Deadline</dt>
              <dd className="font-medium">{formatDeadline(drive!.deadline)}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Pledges</dt>
            <dd className="font-medium">{drive!.pledgeCount}</dd>
          </div>
        </dl>

        <PledgeSection
          driveId={drive!.id}
          organizerId={drive!.organizerId}
          driveStatus={drive!.status}
          initialPledge={userPledge}
          pledges={pledges as never}
        />
      </div>
    </div>
  )
}
