import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/middleware'
import { aiRatelimit } from '@/lib/ratelimit'
import { queryRecommendedSkills } from '@/lib/queries/recommendations'
import { db } from '@/db'
import { profiles, locations } from '@/db/schema'
import { eq } from 'drizzle-orm'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  const { success } = await aiRatelimit.limit(`summary:${user.sub}`)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  try {
    const [recommendations, profileRows] = await Promise.all([
      queryRecommendedSkills(user.sub, 5),
      db
        .select({
          name: profiles.name,
          neighborhood: locations.neighborhood,
          city: locations.city,
        })
        .from(profiles)
        .leftJoin(locations, eq(locations.id, profiles.locationId))
        .where(eq(profiles.userId, user.sub))
        .limit(1),
    ])

    if (recommendations.length === 0) {
      return NextResponse.json({ data: { summary: null } })
    }

    const profile = profileRows[0] ?? null
    // Sanitize user-supplied strings — strip newlines to prevent prompt injection
    const sanitize = (s: string | null | undefined) =>
      s ? s.replace(/[\r\n]/g, ' ').slice(0, 100) : null
    const name     = sanitize(profile?.name) ?? 'neighbor'
    const location = profile?.neighborhood
      ? `${sanitize(profile.neighborhood)}, ${sanitize(profile.city)}`
      : sanitize(profile?.city) ?? 'your area'

    const skillList = recommendations
      .map((r, i) => `${i + 1}. "${r.title}" by ${r.ownerName ?? 'a neighbor'}${r.locationNeighborhood ? ` in ${r.locationNeighborhood}` : ''} — ${r.reason}`)
      .join('\n')

    const prompt = `You are a friendly assistant for Neighborhood Hub, a Bulgarian neighborhood sharing platform.

User: ${name}, located in ${location}.

Top skill recommendations for this user:
${skillList}

Write 2 short, friendly sentences (max 60 words total) personalizing why these recommendations are relevant to ${name}. Be specific — mention neighborhood or category names when relevant. Do not list the skills — summarize the pattern. Do not use markdown.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content[0]?.type === 'text' ? message.content[0].text.trim() : null

    return NextResponse.json({ data: { summary } })
  } catch (err) {
    console.error('[GET /api/ai/summary]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
