import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { queryToolsPage } from '@/lib/queries/tools'
import { ToolsClient } from './tools-client'
import type { ToolsPage } from './_hooks/use-tools-list'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Borrow Tools',
  description: 'Borrow tools and equipment from neighbors in your community.',
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; categoryId?: string; locationId?: string; page?: string }>
}) {
  let categories: { id: string; slug: string; label: string }[] = []
  let locations: { id: string; city: string; neighborhood: string }[] = []
  let initialData: ToolsPage | undefined

  const { status, search, categoryId, locationId, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  try {
    const [cats, locs, toolsPage] = await Promise.all([
      queryCategories(),
      queryLocations(),
      queryToolsPage({ status, search, categoryId, locationId, limit: 20, page }),
    ])
    categories = cats
    locations = locs
    initialData = {
      tools: toolsPage.tools,
      total: toolsPage.total,
    }
  } catch {
    categories = []
    locations = []
  }

  return (
    <ToolsClient
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
