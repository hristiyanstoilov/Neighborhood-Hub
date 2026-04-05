import { db } from '@/db'
import { categories } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function queryCategories() {
  return db
    .select({ id: categories.id, slug: categories.slug, label: categories.label })
    .from(categories)
    .orderBy(asc(categories.label))
}
