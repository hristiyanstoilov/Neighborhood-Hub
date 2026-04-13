import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { querySkillsPage } from '@/lib/queries/skills'
import { SkillsClient } from './skills-client'
import type { SkillsPage } from './_hooks/use-skills-list'

export const dynamic = 'force-dynamic'

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; categoryId?: string; locationId?: string; page?: string }>
}) {
  let categories: { id: string; slug: string; label: string }[] = []
  let locations: { id: string; city: string; neighborhood: string }[] = []
  let initialData: SkillsPage | undefined

  const { status, search, categoryId, locationId, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  try {
    const [cats, locs, skillsPage] = await Promise.all([
      queryCategories(),
      queryLocations(),
      querySkillsPage({ status, search, categoryId, locationId, limit: 20, page }),
    ])
    categories = cats
    locations = locs
    initialData = {
      skills: skillsPage.skills,
      total: skillsPage.total,
    }
  } catch {
    categories = []
    locations = []
  }

  return (
    <SkillsClient
      status={status}
      search={search}
      categoryId={categoryId}
      locationId={locationId}
      page={page}
      categories={categories}
      locations={locations}
      initialData={initialData}
    />
  )
}
