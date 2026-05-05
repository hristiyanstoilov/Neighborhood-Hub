import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryEventById } from '@/lib/queries/events'
import { uuidSchema } from '@/lib/schemas/skill'
import EditEventForm from './edit-event-form'

export const dynamic = 'force-dynamic'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect(`/login?next=/events/${id}/edit`)

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect(`/login?next=/events/${id}/edit`)

  const event = await queryEventById(id)
  if (!event) notFound()
  if (event.organizerId !== user.id) notFound()

  const t = await getTranslations('events')

  const eventData = {
    id:          event.id,
    title:       event.title,
    description: event.description,
    address:     event.address,
    startsAt:    event.startsAt.toISOString(),
    endsAt:      event.endsAt?.toISOString() ?? null,
    maxCapacity: event.maxCapacity,
    status:      event.status,
    imageUrl:    event.imageUrl,
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('edit_page_title')}</h1>
      <EditEventForm event={eventData} />
    </div>
  )
}
