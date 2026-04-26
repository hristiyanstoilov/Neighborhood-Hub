import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import {
  users, profiles, refreshTokens, skills, tools, foodShares, events,
  communityDrives, skillRequests, toolReservations, foodReservations,
  drivePledges, eventAttendees, ratings, notifications, aiConversations,
  contentReports,
} from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

// ─── GET /api/account/export — GDPR Art. 20 data portability ─────────────────

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  try {
    const [
      dbUser, profile, mySkills, myTools, myFoodShares, myEvents, myDrives,
      mySkillRequests, myToolReservations, myFoodReservations, myPledges,
      myRsvps, myRatings, myReports,
    ] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, user.sub), columns: { id: true, email: true, role: true, emailVerifiedAt: true, createdAt: true } }),
      db.query.profiles.findFirst({ where: eq(profiles.userId, user.sub) }),
      db.select().from(skills).where(eq(skills.ownerId, user.sub)),
      db.select().from(tools).where(eq(tools.ownerId, user.sub)),
      db.select().from(foodShares).where(eq(foodShares.ownerId, user.sub)),
      db.select().from(events).where(eq(events.organizerId, user.sub)),
      db.select().from(communityDrives).where(eq(communityDrives.organizerId, user.sub)),
      db.select().from(skillRequests).where(eq(skillRequests.userFromId, user.sub)),
      db.select().from(toolReservations).where(eq(toolReservations.borrowerId, user.sub)),
      db.select().from(foodReservations).where(eq(foodReservations.requesterId, user.sub)),
      db.select().from(drivePledges).where(eq(drivePledges.userId, user.sub)),
      db.select().from(eventAttendees).where(eq(eventAttendees.userId, user.sub)),
      db.select().from(ratings).where(eq(ratings.raterId, user.sub)),
      db.select().from(contentReports).where(eq(contentReports.reporterId, user.sub)),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      account: dbUser,
      profile,
      skills: mySkills,
      tools: myTools,
      foodShares: myFoodShares,
      events: myEvents,
      communityDrives: myDrives,
      skillRequests: mySkillRequests,
      toolReservations: myToolReservations,
      foodReservations: myFoodReservations,
      drivePledges: myPledges,
      eventAttendees: myRsvps,
      ratingsGiven: myRatings,
      contentReports: myReports,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="neighborhood-hub-data-${user.sub.slice(0, 8)}.json"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/account/export]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

const deleteAccountSchema = z.object({
  password: z.string().min(1),
})

// ─── DELETE /api/account — GDPR Art. 17 right to erasure ─────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const parsed = deleteAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser || dbUser.deletedAt) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const passwordMatch = await bcrypt.compare(parsed.data.password, dbUser.passwordHash)
    if (!passwordMatch) return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 403 })

    const now = new Date()
    const anonymizedEmail = `deleted-${user.sub}@deleted.invalid`

    // 1. Anonymize + soft-delete the user record
    await db.update(users).set({
      email: anonymizedEmail,
      passwordHash: 'DELETED',
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      notificationsEnabled: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      deletedAt: now,
      updatedAt: now,
    }).where(eq(users.id, user.sub))

    // 2. Delete PII-bearing records
    await db.delete(profiles).where(eq(profiles.userId, user.sub))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.sub))

    // 3. Soft-delete owned content
    await db.update(skills).set({ deletedAt: now }).where(and(eq(skills.ownerId, user.sub)))
    await db.update(tools).set({ deletedAt: now }).where(and(eq(tools.ownerId, user.sub)))
    await db.update(foodShares).set({ deletedAt: now }).where(and(eq(foodShares.ownerId, user.sub)))
    await db.update(events).set({ deletedAt: now }).where(and(eq(events.organizerId, user.sub)))
    await db.update(communityDrives).set({ deletedAt: now }).where(and(eq(communityDrives.organizerId, user.sub)))

    // 4. Cancel active reservations/requests as requester
    await db.update(skillRequests)
      .set({ status: 'cancelled', updatedAt: now })
      .where(and(eq(skillRequests.userFromId, user.sub), inArray(skillRequests.status, ['pending', 'accepted'])))

    await db.update(toolReservations)
      .set({ status: 'cancelled', updatedAt: now })
      .where(and(eq(toolReservations.borrowerId, user.sub), inArray(toolReservations.status, ['pending', 'approved'])))

    await db.update(foodReservations)
      .set({ status: 'cancelled', updatedAt: now })
      .where(and(eq(foodReservations.requesterId, user.sub), inArray(foodReservations.status, ['pending', 'reserved'])))

    // 5. Delete personal inbox data
    await db.delete(notifications).where(eq(notifications.userId, user.sub))
    await db.delete(aiConversations).where(eq(aiConversations.userId, user.sub))

    await writeAuditLog({
      userId: user.sub,
      userEmail: dbUser.email,
      action: 'delete',
      entity: 'users',
      entityId: user.sub,
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[DELETE /api/account]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
