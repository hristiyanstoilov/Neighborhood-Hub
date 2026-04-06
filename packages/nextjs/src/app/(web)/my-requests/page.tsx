import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkillRequestsByUser } from '@/lib/queries/skill-requests'
import RequestCard from './request-card'

export const dynamic = 'force-dynamic'

type Role = 'requester' | 'owner'

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/my-requests')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/my-requests')

  const { role: rawRole } = await searchParams
  const role: Role = rawRole === 'owner' ? 'owner' : 'requester'

  const requests = await querySkillRequestsByUser(user.id, { role, page: 1, limit: 50 })

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-green-700 text-white'
        : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
    }`

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Requests</h1>

      <div className="flex gap-2 mb-6">
        <Link href="/my-requests?role=requester" className={tabClass(role === 'requester')}>
          Sent
        </Link>
        <Link href="/my-requests?role=owner" className={tabClass(role === 'owner')}>
          Received
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base">
            {role === 'requester'
              ? "You haven't sent any skill requests yet."
              : "You haven't received any skill requests yet."}
          </p>
          {role === 'requester' && (
            <Link
              href="/skills"
              className="mt-4 inline-block text-sm text-green-700 hover:underline"
            >
              Browse skills
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} viewerId={user.id} />
          ))}
        </div>
      )}
    </div>
  )
}
