import { NextResponse } from 'next/server'
import { db } from '@/db'
import { categories } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const rows = await db
      .select({ id: categories.id, slug: categories.slug, label: categories.label })
      .from(categories)
      .orderBy(asc(categories.label))
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}