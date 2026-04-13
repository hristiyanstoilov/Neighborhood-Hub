import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { MyRequestsClient } from './my-requests-client'

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

  return <MyRequestsClient role={role} viewerId={user.id} />
}
