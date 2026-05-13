import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, skillEndorsements } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { requireAuthWithRateLimit } from '@/lib/middleware'
import { isUniqueViolation } from '@/lib/db-errors'
import { uuidSchema } from '@/lib/schemas/skill'

// POST /api/skills/[id]/endorse
export const POST = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const id = params.id
    if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const [skill] = await db
      .select({ id: skills.id, ownerId: skills.ownerId })
      .from(skills)
      .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
      .limit(1)
    if (!skill) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    if (skill.ownerId === user.sub) return NextResponse.json({ error: 'CANNOT_ENDORSE_OWN_SKILL' }, { status: 422 })

    try {
      await db.insert(skillEndorsements).values({ skillId: id, endorserId: user.sub }).returning()
    } catch (err: unknown) {
      if (isUniqueViolation(err, 'skill_endorsements_skill_endorser_idx')) {
        return NextResponse.json({ error: 'ALREADY_ENDORSED' }, { status: 409 })
      }
      throw err
    }

    return NextResponse.json({ data: { endorsed: true } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/skills/[id]/endorse]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// DELETE /api/skills/[id]/endorse
export const DELETE = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const id = params.id
    if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    await db.delete(skillEndorsements).where(and(eq(skillEndorsements.skillId, id), eq(skillEndorsements.endorserId, user.sub)))

    return NextResponse.json({ data: { endorsed: false } })
  } catch (err) {
    console.error('[DELETE /api/skills/[id]/endorse]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
