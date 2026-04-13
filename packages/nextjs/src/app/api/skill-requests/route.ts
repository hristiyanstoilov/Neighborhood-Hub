import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skillRequests, skills, notifications, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createSkillRequestSchema, listSkillRequestsSchema } from '@/lib/schemas/skill-request'
import { querySkillRequestsByUser } from '@/lib/queries/skill-requests'

// ─── GET /api/skill-requests — list requests visible to the current user ─────

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = listSkillRequestsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const rows = await querySkillRequestsByUser(user.sub, parsed.data)
    return NextResponse.json({ data: rows, page: parsed.data.page, limit: parsed.data.limit })
  } catch (err) {
    console.error('[GET /api/skill-requests]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── POST /api/skill-requests — create a request ─────────────────────────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    // Email must be verified
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createSkillRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { skillId, scheduledStart, scheduledEnd, meetingType, meetingUrl, notes } = parsed.data

    // Load skill
    const skill = await db.query.skills.findFirst({ where: eq(skills.id, skillId) })
    if (!skill || skill.deletedAt) {
      return NextResponse.json({ error: 'SKILL_NOT_FOUND' }, { status: 404 })
    }
    if (skill.status !== 'available') {
      return NextResponse.json({ error: 'SKILL_NOT_AVAILABLE' }, { status: 409 })
    }
    if (skill.ownerId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_REQUEST_OWN_SKILL' }, { status: 400 })
    }

    // Duplicate check — one active request per user+skill
    const existing = await db.query.skillRequests.findFirst({
      where: and(
        eq(skillRequests.skillId, skillId),
        eq(skillRequests.userFromId, user.sub),
        inArray(skillRequests.status, ['pending', 'accepted'])
      ),
    })
    if (existing) {
      return NextResponse.json({ error: 'REQUEST_ALREADY_EXISTS' }, { status: 409 })
    }

    const [newRequest] = await db
      .insert(skillRequests)
      .values({
        skillId,
        userFromId: user.sub,
        userToId: skill.ownerId,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        meetingType,
        meetingUrl: meetingUrl ?? null,
        notes: notes ?? null,
      })
      .returning()

    // Notify the skill owner — fire and forget
    db.insert(notifications)
      .values({
        userId: skill.ownerId,
        type: 'new_request',
        entityType: 'skill_request',
        entityId: newRequest.id,
      })
      .catch(() => {})

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'create',
      entity: 'skill_requests',
      entityId: newRequest.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: newRequest }, { status: 201 })
  } catch (err: unknown) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code?: string }).code : undefined
    // Unique constraint — concurrent duplicate request
    if (code === '23505') {
      return NextResponse.json({ error: 'REQUEST_ALREADY_EXISTS' }, { status: 409 })
    }
    // FK violation — skill was deleted between availability check and INSERT
    if (code === '23503') {
      return NextResponse.json({ error: 'SKILL_NOT_FOUND' }, { status: 404 })
    }
    console.error('[POST /api/skill-requests]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
