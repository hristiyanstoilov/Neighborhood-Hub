import { db } from '@/db'
import { skills, profiles, categories, locations } from '@/db/schema'
import { eq, and, isNull, desc, ilike } from 'drizzle-orm'

const skillSelect = {
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

export async function querySkills(opts: {
  status?: string
  search?: string
  categoryId?: string
  locationId?: string
  ownerId?: string
  limit?: number
  page?: number
}) {
  const { status, search, categoryId, locationId, ownerId, limit = 20, page = 1 } = opts
  const conditions = [isNull(skills.deletedAt)]
  if (status) conditions.push(eq(skills.status, status))
  if (categoryId) conditions.push(eq(skills.categoryId, categoryId))
  if (locationId) conditions.push(eq(skills.locationId, locationId))
  if (ownerId) conditions.push(eq(skills.ownerId, ownerId))
  if (search) conditions.push(ilike(skills.title, `%${search}%`))

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
