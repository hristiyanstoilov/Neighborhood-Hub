import { notFound } from 'next/navigation'
import { db } from '@/db'
import { users, profiles, locations, skills, categories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { uuidSchema } from '@/lib/schemas/skill'
import { ErrorState } from '@/components/ui/async-states'
import { PublicProfileBackLink } from './_components/public-profile-back-link'
import { PublicProfileHeader } from './_components/public-profile-header'
import { PublicProfileSkills } from './_components/public-profile-skills'
import { PublicProfileRatings } from './_components/public-profile-ratings'
import { PrivateProfileState } from './_components/private-profile-state'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return {}
  try {
    const [r] = await db
      .select({ name: profiles.name, bio: profiles.bio })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    if (!r) return {}
    const name = r.name ?? 'Neighbor'
    return {
      title: `${name}'s Profile`,
      description: r.bio ?? `View ${name}'s skills and profile on Neighborhood Hub.`,
    }
  } catch { return {} }
}

type Props = { params: Promise<{ id: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  let row: {
    userId: string; name: string | null; bio: string | null
    avatarUrl: string | null; isPublic: boolean
    avgRating: string | null; ratingCount: number
    city: string | null; neighborhood: string | null
  } | null = null
  let fetchError = false

  try {
    const [r] = await db
      .select({
        userId: users.id,
        name: profiles.name,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        isPublic: profiles.isPublic,
        avgRating: profiles.avgRating,
        ratingCount: profiles.ratingCount,
        city: locations.city,
        neighborhood: locations.neighborhood,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(locations, eq(locations.id, profiles.locationId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    row = r ?? null
  } catch {
    fetchError = true
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <PublicProfileBackLink />
        <ErrorState title="Could not load this profile." message="Please try refreshing the page." />
      </div>
    )
  }

  if (!row) notFound()

  if (!row.isPublic) {
    return (
      <div className="max-w-2xl">
        <PublicProfileBackLink />
        <PrivateProfileState />
      </div>
    )
  }

  const userSkills = await db
    .select({
      id: skills.id,
      title: skills.title,
      imageUrl: skills.imageUrl,
      categoryLabel: categories.label,
    })
    .from(skills)
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .where(and(eq(skills.ownerId, id), isNull(skills.deletedAt), eq(skills.status, 'available')))
    .limit(20)

  const location = row.neighborhood
    ? `${row.neighborhood}, ${row.city ?? ''}`
    : row.city ?? null

  return (
    <div className="max-w-2xl">
      <PublicProfileBackLink />
      <PublicProfileHeader
        name={row.name}
        avatarUrl={row.avatarUrl}
        location={location}
        bio={row.bio}
        avgRating={row.avgRating}
        ratingCount={row.ratingCount}
      />
      <PublicProfileSkills skills={userSkills} />
      <div className="mt-6">
        <PublicProfileRatings userId={id} />
      </div>
    </div>
  )
}