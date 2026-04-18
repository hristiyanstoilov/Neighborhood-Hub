import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryLocations } from '@/lib/queries/locations'
import NewFoodForm from './new-food-form'

export const dynamic = 'force-dynamic'

export default async function NewFoodPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/food/new')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/food/new')

  const locations = await queryLocations()
  return <NewFoodForm locations={locations} />
}