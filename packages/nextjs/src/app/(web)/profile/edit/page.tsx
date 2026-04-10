import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { EditProfileClient } from './edit-profile-client'

export default async function EditProfilePage() {
  // Server-side auth guard: validate active refresh token in DB.
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) {
    redirect('/login?next=/profile/edit')
  }

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) {
    redirect('/login?next=/profile/edit')
  }

  // Auth verified, render client component to handle locations loading and form
  return <EditProfileClient />
}
