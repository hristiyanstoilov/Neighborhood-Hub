import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryToolById } from '@/lib/queries/tools'
import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { uuidSchema } from '@/lib/schemas/skill'
import EditToolForm from './edit-tool-form'

export const dynamic = 'force-dynamic'

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect(`/login?next=/tools/${id}/edit`)

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect(`/login?next=/tools/${id}/edit`)

  const tool = await queryToolById(id)
  if (!tool) notFound()

  if (tool.ownerId !== user.id) notFound()

  const [cats, locs] = await Promise.all([queryCategories(), queryLocations()])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit tool</h1>
      <EditToolForm tool={tool} categories={cats} locations={locs} />
    </div>
  )
}
