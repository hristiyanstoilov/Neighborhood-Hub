import { db } from '@/db'
import { tools, profiles, categories, locations } from '@/db/schema'
import { eq, and, isNull, desc, ilike, count, SQL } from 'drizzle-orm'

export const toolSelect = {
  id:                   tools.id,
  title:                tools.title,
  description:          tools.description,
  status:               tools.status,
  condition:            tools.condition,
  imageUrl:             tools.imageUrl,
  createdAt:            tools.createdAt,
  updatedAt:            tools.updatedAt,
  ownerId:              tools.ownerId,
  ownerName:            profiles.name,
  ownerAvatar:          profiles.avatarUrl,
  categoryId:           tools.categoryId,
  categorySlug:         categories.slug,
  categoryLabel:        categories.label,
  locationId:           tools.locationId,
  locationCity:         locations.city,
  locationNeighborhood: locations.neighborhood,
} as const

export type ToolFilterOpts = {
  status?:     string
  search?:     string
  categoryId?: string
  locationId?: string
  ownerId?:    string
}

export function buildToolConditions(opts: ToolFilterOpts): SQL[] {
  const conditions: SQL[] = [isNull(tools.deletedAt)]
  if (opts.status)     conditions.push(eq(tools.status, opts.status))
  if (opts.categoryId) conditions.push(eq(tools.categoryId, opts.categoryId))
  if (opts.locationId) conditions.push(eq(tools.locationId, opts.locationId))
  if (opts.ownerId)    conditions.push(eq(tools.ownerId, opts.ownerId))
  if (opts.search)     conditions.push(ilike(tools.title, `%${opts.search}%`))
  return conditions
}

export async function queryToolsPage(
  opts: ToolFilterOpts & { limit?: number; page?: number }
): Promise<{ tools: Awaited<ReturnType<typeof queryTools>>; total: number }> {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildToolConditions(filterOpts)

  const [rows, [{ total }]] = await Promise.all([
    queryTools({ ...filterOpts, limit, page }),
    db.select({ total: count() }).from(tools).where(and(...conditions)),
  ])

  return { tools: rows, total }
}

export async function queryTools(opts: ToolFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildToolConditions(filterOpts)

  return db
    .select(toolSelect)
    .from(tools)
    .leftJoin(profiles,   eq(profiles.userId,    tools.ownerId))
    .leftJoin(categories, eq(categories.id,       tools.categoryId))
    .leftJoin(locations,  eq(locations.id,        tools.locationId))
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(desc(tools.createdAt))
}

export async function queryToolById(id: string) {
  const [row] = await db
    .select(toolSelect)
    .from(tools)
    .leftJoin(profiles,   eq(profiles.userId,    tools.ownerId))
    .leftJoin(categories, eq(categories.id,       tools.categoryId))
    .leftJoin(locations,  eq(locations.id,        tools.locationId))
    .where(and(eq(tools.id, id), isNull(tools.deletedAt)))
    .limit(1)
  return row ?? null
}
