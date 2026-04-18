import { db } from '@/db'
import { communityDrives, drivePledges, profiles } from '@/db/schema'
import { and, count, desc, eq, isNull, sql, SQL } from 'drizzle-orm'

export const driveSelect = {
  id:              communityDrives.id,
  title:           communityDrives.title,
  description:     communityDrives.description,
  driveType:       communityDrives.driveType,
  goalDescription: communityDrives.goalDescription,
  dropOffAddress:  communityDrives.dropOffAddress,
  deadline:        communityDrives.deadline,
  imageUrl:        communityDrives.imageUrl,
  status:          communityDrives.status,
  createdAt:       communityDrives.createdAt,
  updatedAt:       communityDrives.updatedAt,
  organizerId:     communityDrives.organizerId,
  organizerName:   profiles.name,
} as const

export type DriveFilterOpts = {
  status?:    string
  driveType?: string
  ownerId?:   string
}

export function buildDriveConditions(opts: DriveFilterOpts): SQL[] {
  const conditions: SQL[] = [isNull(communityDrives.deletedAt)]
  if (opts.status)    conditions.push(eq(communityDrives.status, opts.status))
  if (opts.driveType) conditions.push(eq(communityDrives.driveType, opts.driveType))
  if (opts.ownerId)   conditions.push(eq(communityDrives.organizerId, opts.ownerId))
  return conditions
}

export async function queryDrives(opts: DriveFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildDriveConditions(filterOpts)

  return db
    .select(driveSelect)
    .from(communityDrives)
    .leftJoin(profiles, eq(profiles.userId, communityDrives.organizerId))
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(desc(communityDrives.createdAt))
}

export async function queryDrivesPage(opts: DriveFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildDriveConditions(filterOpts)

  const [rows, [{ total }]] = await Promise.all([
    queryDrives({ ...filterOpts, limit, page }),
    db.select({ total: count() }).from(communityDrives).where(and(...conditions)),
  ])

  return { drives: rows, total }
}

export async function queryDriveById(id: string) {
  const [row] = await db
    .select({
      ...driveSelect,
      pledgeCount: sql<number>`(
        SELECT count(*)::int FROM drive_pledges
        WHERE drive_id = ${communityDrives.id} AND status != 'cancelled'
      )`,
    })
    .from(communityDrives)
    .leftJoin(profiles, eq(profiles.userId, communityDrives.organizerId))
    .where(and(eq(communityDrives.id, id), isNull(communityDrives.deletedAt)))
    .limit(1)

  return row ?? null
}

export async function queryUserPledge(driveId: string, userId: string) {
  const [row] = await db
    .select({ id: drivePledges.id, status: drivePledges.status, pledgeDescription: drivePledges.pledgeDescription })
    .from(drivePledges)
    .where(and(eq(drivePledges.driveId, driveId), eq(drivePledges.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function queryDrivePledges(driveId: string) {
  return db
    .select({
      id:                drivePledges.id,
      userId:            drivePledges.userId,
      pledgeDescription: drivePledges.pledgeDescription,
      status:            drivePledges.status,
      createdAt:         drivePledges.createdAt,
      userName:          profiles.name,
    })
    .from(drivePledges)
    .leftJoin(profiles, eq(profiles.userId, drivePledges.userId))
    .where(eq(drivePledges.driveId, driveId))
    .orderBy(desc(drivePledges.createdAt))
}
