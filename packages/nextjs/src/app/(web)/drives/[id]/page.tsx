import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { queryDriveById, queryDrivePledges, queryUserPledge } from '@/lib/queries/drives'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import PledgeSection from './pledge-section'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const drive = await queryDriveById(id)
    if (!drive) return {}
    return {
      title: drive.title,
      description: drive.description ?? `Support this community drive on Neighborhood Hub.`,
    }
  } catch { return {} }
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
  const t = await getTranslations('drives')
  const tCommon = await getTranslations('common')

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
          {t('back')}
        </Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">{t('detail_error_title')}</p>
          <p className="text-sm">{t('detail_error_message')}</p>
        </div>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    open:      t('status_open'),
    completed: tCommon('status.completed'),
    cancelled: tCommon('status.cancelled'),
  }

  const typeLabels: Record<string, string> = {
    items: t('type_items'),
    food:  t('type_food'),
    money: t('type_money'),
    other: t('type_other'),
  }

  return (
    <div className="max-w-2xl">
      <Link href="/drives" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
        {t('back')}
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {drive!.imageUrl && (
          <Image
            src={drive!.imageUrl}
            alt={drive!.title}
            width={1200}
            height={500}
            unoptimized
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold leading-snug">{drive!.title}</h1>
            <span className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
              drive!.status === 'open'
                ? 'bg-green-100 text-green-700'
                : drive!.status === 'cancelled'
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {statusLabels[drive!.status] ?? drive!.status}
            </span>
          </div>

          {drive!.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{drive!.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_type')}</dt>
              <dd className="font-medium">{typeLabels[drive!.driveType] ?? drive!.driveType}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_organised_by')}</dt>
              <dd className="font-medium">
                <Link href={`/users/${drive!.organizerId}`} className="hover:text-green-700 hover:underline">
                  {drive!.organizerName ?? t('anonymous')}
                </Link>
              </dd>
            </div>
            {drive!.goalDescription && (
              <div className="col-span-2">
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_goal')}</dt>
                <dd className="font-medium">{drive!.goalDescription}</dd>
              </div>
            )}
            {drive!.goalAmount != null && (
              <div className="col-span-2">
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_progress')}</dt>
                <dd className="font-medium">
                  {drive!.currentAmount ?? 0} of {drive!.goalAmount} collected
                </dd>
              </div>
            )}
            {drive!.dropOffAddress && (
              <div className="col-span-2">
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_dropoff')}</dt>
                <dd className="font-medium">{drive!.dropOffAddress}</dd>
              </div>
            )}
            {drive!.deadline && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_deadline')}</dt>
                <dd className="font-medium">{formatDeadline(drive!.deadline)}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_pledges')}</dt>
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
    </div>
  )
}
