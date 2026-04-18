import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryFoodShareById } from '@/lib/queries/food'
import { queryLocations } from '@/lib/queries/locations'
import EditFoodForm from './edit-food-form'

export const dynamic = 'force-dynamic'

export default async function EditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect(`/login?next=/food/${id}/edit`)

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect(`/login?next=/food/${id}/edit`)

  const foodShare = await queryFoodShareById(id)
  if (!foodShare) notFound()
  if (foodShare.ownerId !== user.id) redirect(`/food/${id}`)

  const locations = await queryLocations()
  return <EditFoodForm foodShare={foodShare} locations={locations} />
}