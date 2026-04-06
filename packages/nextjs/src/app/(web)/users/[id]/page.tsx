import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { users, profiles, locations, skills, categories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params

  // Load profile — only if user exists, not deleted, profile is public
  const [row] = await db
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

  if (!row || !row.isPublic) {
    notFound()
  }

  // Load their public available skills
  const userSkills = await db
    .select({
      id: skills.id,
      title: skills.title,
      status: skills.status,
      categoryLabel: categories.label,
    })
    .from(skills)
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .where(and(
      eq(skills.ownerId, id),
      isNull(skills.deletedAt),
      eq(skills.status, 'available')
    ))
    .limit(20)

  const location = row.neighborhood
    ? `${row.neighborhood}, ${row.city ?? ''}`
    : row.city ?? null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 shrink-0 overflow-hidden">
            {row.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatarUrl} alt={row.name ?? 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              (row.name?.[0] ?? '?').toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {row.name ?? 'Neighbor'}
            </h1>
            {location && (
              <p className="text-sm text-gray-500 mt-0.5">📍 {location}</p>
            )}
            {row.bio && (
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">{row.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Skills offered */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Skills offered
        </h2>

        {userSkills.length === 0 ? (
          <p className="text-sm text-gray-400">No available skills at the moment.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {userSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-green-400 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{skill.title}</p>
                  {skill.categoryLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">{skill.categoryLabel}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0 ml-3">
                  available
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/skills" className="text-sm text-green-700 hover:underline">
          ← Browse all skills
        </Link>
      </div>
    </div>
  )
}