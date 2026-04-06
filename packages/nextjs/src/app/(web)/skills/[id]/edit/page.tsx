import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkillById } from '@/lib/queries/skills'
import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { uuidSchema } from '@/lib/schemas/skill'
import EditSkillForm from './edit-skill-form'

export const dynamic = 'force-dynamic'

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect(`/login?next=/skills/${id}/edit`)

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect(`/login?next=/skills/${id}/edit`)

  const skill = await querySkillById(id)
  if (!skill) notFound()

  // Non-owners get 404 — avoids leaking that the skill exists
  if (skill.ownerId !== user.id) notFound()

  const [cats, locs] = await Promise.all([queryCategories(), queryLocations()])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit skill</h1>
      <EditSkillForm skill={skill} categories={cats} locations={locs} />
    </div>
  )
}
