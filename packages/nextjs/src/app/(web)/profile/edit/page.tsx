import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryLocations } from '@/lib/queries/locations'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import EditProfileForm from './edit-profile-form'

export const dynamic = 'force-dynamic'

export default async function EditProfilePage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/profile/edit')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/profile/edit')

  const [profile, locs] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
    queryLocations(),
  ])

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit profile</h1>
      <EditProfileForm profile={profile ?? null} locations={locs} />
    </div>
  )
}
