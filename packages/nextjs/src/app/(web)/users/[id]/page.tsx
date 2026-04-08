import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { users, profiles, locations, skills, categories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { uuidSchema } from '@/lib/schemas/skill'
import { EmptyState, ErrorState } from '@/components/ui/async-states'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  let row: {
    userId: string; name: string | null; bio: string | null
    avatarUrl: string | null; isPublic: boolean
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
        <Link href="/skills" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">← Browse skills</Link>
        <ErrorState title="Could not load this profile." message="Please try refreshing the page." />
      </div>
    )
  }

  if (!row) notFound()

  if (!row.isPublic) {
    return (
      <div className="max-w-2xl">
        <Link href="/skills" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">← Browse skills</Link>
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Private profile</h1>
          <p className="text-sm text-gray-400">This neighbor has set their profile to private.</p>
        </div>
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
      <Link href="/skills" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">← Browse skills</Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 shrink-0 overflow-hidden border border-gray-100">
            {row.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={row.avatarUrl} alt={row.name ?? 'Avatar'} className="w-full h-full object-cover" />
              : (row.name?.[0] ?? '?').toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{row.name ?? 'Neighbor'}</h1>
            {location && <p className="text-sm text-gray-500 mt-0.5">📍 {location}</p>}
            {row.bio && <p className="text-sm text-gray-700 mt-3 leading-relaxed">{row.bio}</p>}
          </div>
        </div>
      </div>

      {/* Skills */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        Skills offered
        {userSkills.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-400">({userSkills.length})</span>
        )}
      </h2>

      {userSkills.length === 0 ? (
        <EmptyState title="No available skills at the moment." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {userSkills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
            >
              {skill.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={skill.imageUrl} alt={skill.title} className="w-full h-24 object-cover" />
              )}
              <div className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{skill.title}</p>
                  {skill.categoryLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">{skill.categoryLabel}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  available
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}