import { db } from '@/db'
import { skills, profiles, categories, locations } from '@/db/schema'
import { eq, and, isNull, desc, ilike, count, SQL } from 'drizzle-orm'

export const skillSelect = {
  id: skills.id,
  title: skills.title,
  description: skills.description,
  status: skills.status,
  availableHours: skills.availableHours,
  imageUrl: skills.imageUrl,
  createdAt: skills.createdAt,
  updatedAt: skills.updatedAt,
  ownerId: skills.ownerId,
  ownerName: profiles.name,
  ownerAvatar: profiles.avatarUrl,
  categoryId: skills.categoryId,
  categorySlug: categories.slug,
  categoryLabel: categories.label,
  locationId: skills.locationId,
  locationCity: locations.city,
  locationNeighborhood: locations.neighborhood,
} as const

export type SkillFilterOpts = {
  status?: string
  search?: string
  categoryId?: string
  locationId?: string
  ownerId?: string
}

export function buildSkillConditions(opts: SkillFilterOpts): SQL[] {
  const conditions: SQL[] = [isNull(skills.deletedAt)]
  if (opts.status) conditions.push(eq(skills.status, opts.status))
  if (opts.categoryId) conditions.push(eq(skills.categoryId, opts.categoryId))
  if (opts.locationId) conditions.push(eq(skills.locationId, opts.locationId))
  if (opts.ownerId) conditions.push(eq(skills.ownerId, opts.ownerId))
  if (opts.search) conditions.push(ilike(skills.title, `%${opts.search}%`))
  return conditions
}

export async function querySkills(opts: SkillFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildSkillConditions(filterOpts)

  return db
    .select(skillSelect)
    .from(skills)
    .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .leftJoin(locations, eq(locations.id, skills.locationId))
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(desc(skills.createdAt))
}

export async function querySkillsPage(opts: SkillFilterOpts & {
  limit?: number
  page?: number
}): Promise<{ skills: Awaited<ReturnType<typeof querySkills>>; total: number }> {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildSkillConditions(filterOpts)

  const [rows, [{ total }]] = await Promise.all([
    querySkills({ ...filterOpts, limit, page }),
    db.select({ total: count() }).from(skills).where(and(...conditions)),
  ])

  return { skills: rows, total }
}

export async function querySkillById(id: string) {
  const [row] = await db
    .select(skillSelect)
    .from(skills)
    .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .leftJoin(locations, eq(locations.id, skills.locationId))
    .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
    .limit(1)
  return row ?? null
}
