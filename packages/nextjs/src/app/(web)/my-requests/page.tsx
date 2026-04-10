import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkillRequestsByUser } from '@/lib/queries/skill-requests'
import RequestCard from './request-card'
import { RoleTabs } from './_components/role-tabs'
import { RequestsEmptyState } from './_components/requests-empty-state'

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Requests</h1>

      <RoleTabs role={role} />

      {requests.length === 0 ? (
        <RequestsEmptyState role={role} />
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
