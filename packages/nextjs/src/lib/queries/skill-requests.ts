import { db } from '@/db'
import { skillRequests, skills, profiles } from '@/db/schema'
import { eq, or, and, desc, isNull, count, SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const requesterProfile = alias(profiles, 'requester_profile')
const ownerProfile = alias(profiles, 'owner_profile')

const skillRequestSelect = {
  id: skillRequests.id,
  skillId: skillRequests.skillId,
  skillTitle: skills.title,
  skillOwnerId: skills.ownerId,
  userFromId: skillRequests.userFromId,
  requesterName: requesterProfile.name,
  requesterAvatar: requesterProfile.avatarUrl,
  userToId: skillRequests.userToId,
  ownerName: ownerProfile.name,
  ownerAvatar: ownerProfile.avatarUrl,
  scheduledStart: skillRequests.scheduledStart,
  scheduledEnd: skillRequests.scheduledEnd,
  meetingType: skillRequests.meetingType,
  meetingUrl: skillRequests.meetingUrl,
  status: skillRequests.status,
  notes: skillRequests.notes,
  cancellationReason: skillRequests.cancellationReason,
  cancelledById: skillRequests.cancelledById,
  completedAt: skillRequests.completedAt,
  createdAt: skillRequests.createdAt,
  updatedAt: skillRequests.updatedAt,
}

interface ListOpts {
  role?: 'requester' | 'owner'
  status?: string
  page: number
  limit: number
}

function buildSkillRequestConditions(userId: string, opts: Pick<ListOpts, 'role' | 'status'>): SQL[] {
  const { role, status } = opts
  const conditions: SQL[] = [isNull(skills.deletedAt)]

  if (role === 'requester') {
    conditions.push(eq(skillRequests.userFromId, userId))
  } else if (role === 'owner') {
    conditions.push(eq(skillRequests.userToId, userId))
  } else {
    conditions.push(or(eq(skillRequests.userFromId, userId), eq(skillRequests.userToId, userId))!)
  }

  if (status) {
    conditions.push(eq(skillRequests.status, status))
  }

  return conditions
}

export async function querySkillRequestsByUser(userId: string, opts: ListOpts) {
  const { page, limit } = opts
  const conditions = buildSkillRequestConditions(userId, opts)

  return db
    .select(skillRequestSelect)
    .from(skillRequests)
    .innerJoin(skills, eq(skills.id, skillRequests.skillId))
    .leftJoin(requesterProfile, eq(requesterProfile.userId, skillRequests.userFromId))
    .leftJoin(ownerProfile, eq(ownerProfile.userId, skillRequests.userToId))
    .where(and(...conditions))
    .orderBy(desc(skillRequests.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
}

export async function countSkillRequestsByUser(userId: string, opts: Pick<ListOpts, 'role' | 'status'>) {
  const conditions = buildSkillRequestConditions(userId, opts)
  const [{ total }] = await db
    .select({ total: count() })
    .from(skillRequests)
    .innerJoin(skills, eq(skills.id, skillRequests.skillId))
    .where(and(...conditions))
  return total
}

export type SkillRequestRow = Awaited<ReturnType<typeof querySkillRequestsByUser>>[number]
