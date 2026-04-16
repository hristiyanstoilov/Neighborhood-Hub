import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { MyReservationsClient } from './my-reservations-client'

export const dynamic = 'force-dynamic'

type Role = 'borrower' | 'owner'

export default async function MyReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/my-reservations')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/my-reservations')

  const { role: rawRole } = await searchParams
  const role: Role = rawRole === 'owner' ? 'owner' : 'borrower'

  return <MyReservationsClient role={role} viewerId={user.id} />
}
