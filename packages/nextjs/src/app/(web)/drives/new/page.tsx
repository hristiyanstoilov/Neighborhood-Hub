import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import NewDriveForm from './new-drive-form'

export const dynamic = 'force-dynamic'

export default async function NewDrivePage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/drives/new')

  const user = await queryUserByRefreshToken(refreshToken).catch(() => null)
  if (!user) redirect('/login?next=/drives/new')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Start a Community Drive</h1>
      <NewDriveForm />
    </div>
  )
}
