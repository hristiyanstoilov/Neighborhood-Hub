import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryUserPledges } from '@/lib/queries/drives'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Drives — Neighborhood Hub' }

const PLEDGE_STATUS_STYLES: Record<string, string> = {
  pledged:   'bg-green-100 text-green-700',
  fulfilled: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const DRIVE_STATUS_STYLES: Record<string, string> = {
  open:      'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
}

export default async function MyDrivesPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/my-drives')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/my-drives')

  const pledges = await queryUserPledges(user.id)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Pledges</h1>
        <Link href="/drives" className="text-sm text-green-700 hover:underline">Browse drives →</Link>
      </div>

      {pledges.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 mb-3">You have not pledged to any community drives yet.</p>
          <Link href="/drives" className="inline-block bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors">
            Find drives nearby
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pledges.map((pledge) => (
            <Link
              key={pledge.pledgeId}
              href={`/drives/${pledge.driveId}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-semibold text-gray-900 line-clamp-1">{pledge.driveTitle}</p>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLEDGE_STATUS_STYLES[pledge.pledgeStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                    {pledge.pledgeStatus.charAt(0).toUpperCase() + pledge.pledgeStatus.slice(1)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DRIVE_STATUS_STYLES[pledge.driveStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                    {pledge.driveStatus.charAt(0).toUpperCase() + pledge.driveStatus.slice(1)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1 line-clamp-2">{pledge.pledgeDescription}</p>
              <p className="text-xs text-gray-400">
                {pledge.organizerName ? `Organised by ${pledge.organizerName}` : ''}
                {pledge.deadline ? ` · Deadline: ${new Date(pledge.deadline).toLocaleDateString('en-GB')}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
