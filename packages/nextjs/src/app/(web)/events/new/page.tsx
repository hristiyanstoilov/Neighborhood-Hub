import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import NewEventForm from './new-event-form'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/events/new')

  const user = await queryUserByRefreshToken(refreshToken).catch(() => null)
  if (!user) redirect('/login?next=/events/new')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create an Event</h1>
      <NewEventForm />
    </div>
  )
}
