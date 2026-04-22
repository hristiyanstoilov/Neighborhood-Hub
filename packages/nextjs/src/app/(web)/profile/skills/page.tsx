import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkills } from '@/lib/queries/skills'
import { db } from '@/db'
import { skills } from '@/db/schema'
import { eq, and, isNull, count } from 'drizzle-orm'
import { AppIcon } from '@/components/ui/app-icon'

export const dynamic = 'force-dynamic'

const STATUS_CLASSES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-yellow-100 text-yellow-700',
  retired: 'bg-gray-100 text-gray-500',
}

export default async function MySkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const user = refreshToken ? await queryUserByRefreshToken(refreshToken) : null
  if (!user) redirect('/login?next=/profile/skills')

  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const PAGE_SIZE = 12

  const [mySkills, [{ total }]] = await Promise.all([
    querySkills({ ownerId: user.id, limit: PAGE_SIZE, page }),
    db
      .select({ total: count() })
      .from(skills)
      .where(and(eq(skills.ownerId, user.id), isNull(skills.deletedAt))),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/profile" className="text-sm text-gray-400 hover:text-green-700">Profile</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium">My Skills</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
        </div>
        <Link
          href="/skills/new"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
        >
          + Offer a skill
        </Link>
      </div>

      {mySkills.length === 0 ? (
        <div className="text-center py-20">
          <div className="mb-4 inline-flex rounded-full bg-green-50 p-4 text-green-700">
            <AppIcon name="requests" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No skills yet</h2>
          <p className="text-sm text-gray-400 mb-6">Share what you know with your neighborhood.</p>
          <Link
            href="/skills/new"
            className="bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            Offer your first skill
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{total} skill{total !== 1 ? 's' : ''}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mySkills.map((skill) => (
              <div key={skill.id} className="relative bg-white rounded-lg border border-gray-200 overflow-hidden group">
                {skill.imageUrl && (
                  <Image
                    src={skill.imageUrl}
                    alt={skill.title}
                    width={640}
                    height={224}
                    unoptimized
                    className="w-full h-28 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{skill.title}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[skill.status] ?? STATUS_CLASSES.retired}`}>
                      {skill.status}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{skill.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1.5">
                    {skill.categoryLabel && <span>{skill.categoryLabel}</span>}
                    {skill.categoryLabel && skill.locationNeighborhood && <span> · </span>}
                    {skill.locationNeighborhood && <span>{skill.locationNeighborhood}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/skills/${skill.id}`}
                      className="flex-1 text-center text-xs text-gray-600 border border-gray-200 rounded-md py-1.5 hover:border-green-400 hover:text-green-700 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/skills/${skill.id}/edit`}
                      className="flex-1 text-center text-xs text-white bg-green-700 rounded-md py-1.5 hover:bg-green-800 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/profile/skills?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:border-green-400 text-gray-600"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-3 py-1.5 text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/profile/skills?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:border-green-400 text-gray-600"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}