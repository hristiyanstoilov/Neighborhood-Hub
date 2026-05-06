import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  users, profiles, skills, skillRequests, tools, toolReservations,
  events, eventAttendees, communityDrives, drivePledges,
  foodShares, foodReservations, ratings, badges, userStats, messages,
  userConsents,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireVerifiedAuth } from '@/lib/middleware'

export const GET = requireVerifiedAuth(async (_req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(`export:${user.sub}`)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const uid = user.sub

    const [
      accountRows,
      profileRows,
      mySkills,
      sentRequests,
      receivedRequests,
      myTools,
      borrowedReservations,
      ownerReservations,
      myEvents,
      myAttendances,
      myDrives,
      myPledges,
      myFood,
      myFoodReservations,
      ratingsGiven,
      myBadges,
      statsRows,
      myMessages,
      consentRows,
    ] = await Promise.all([
      db.select({ email: users.email, role: users.role, createdAt: users.createdAt, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, uid)).limit(1),
      db.select({ name: profiles.name, bio: profiles.bio, avatarUrl: profiles.avatarUrl, isPublic: profiles.isPublic, avgRating: profiles.avgRating, ratingCount: profiles.ratingCount }).from(profiles).where(eq(profiles.userId, uid)).limit(1),
      db.select().from(skills).where(eq(skills.ownerId, uid)),
      db.select().from(skillRequests).where(eq(skillRequests.userFromId, uid)),
      db.select().from(skillRequests).where(eq(skillRequests.userToId, uid)),
      db.select().from(tools).where(eq(tools.ownerId, uid)),
      db.select().from(toolReservations).where(eq(toolReservations.borrowerId, uid)),
      db.select().from(toolReservations).where(eq(toolReservations.ownerId, uid)),
      db.select().from(events).where(eq(events.organizerId, uid)),
      db.select().from(eventAttendees).where(eq(eventAttendees.userId, uid)),
      db.select().from(communityDrives).where(eq(communityDrives.organizerId, uid)),
      db.select().from(drivePledges).where(eq(drivePledges.userId, uid)),
      db.select().from(foodShares).where(eq(foodShares.ownerId, uid)),
      db.select().from(foodReservations).where(eq(foodReservations.requesterId, uid)),
      db.select().from(ratings).where(eq(ratings.raterId, uid)),
      db.select().from(badges).where(eq(badges.userId, uid)),
      db.select().from(userStats).where(eq(userStats.userId, uid)).limit(1),
      db.select().from(messages).where(eq(messages.senderId, uid)),
      db.select().from(userConsents).where(eq(userConsents.userId, uid)),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      account: accountRows[0] ?? null,
      profile: profileRows[0] ?? null,
      stats: statsRows[0] ?? null,
      badges: myBadges,
      consents: consentRows,
      skills: mySkills,
      skillRequests: { sent: sentRequests, received: receivedRequests },
      tools: myTools,
      toolReservations: { asBorrower: borrowedReservations, asOwner: ownerReservations },
      events: myEvents,
      eventAttendances: myAttendances,
      communityDrives: myDrives,
      drivePledges: myPledges,
      foodShares: myFood,
      foodReservations: myFoodReservations,
      ratingsGiven,
      messagesSent: myMessages,
    }

    const json = JSON.stringify(payload, null, 2)
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="neighborhood-hub-data-export.json"',
      },
    })
  } catch (err) {
    console.error('[GET /api/profile/export]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
