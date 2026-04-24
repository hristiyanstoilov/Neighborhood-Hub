import { db } from '@/db'
import { skills, tools, events, communityDrives, foodShares, profiles } from '@/db/schema'
import { isNull, eq, desc } from 'drizzle-orm'
import { AdminPageHeader } from '../_components/admin-page-header'
import { AdminPagination } from '../_components/admin-pagination'
import { AdminState } from '../_components/admin-state'
import { ListingActions } from './listing-actions'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

type ListingType = 'skill' | 'tool' | 'event' | 'drive' | 'food'

type Row = {
  id: string
  type: ListingType
  title: string
  ownerName: string | null
  status: string
  createdAt: Date
}

const TYPE_LABELS: Record<ListingType, string> = {
  skill: 'Skill',
  tool: 'Tool',
  event: 'Event',
  drive: 'Drive',
  food: 'Food',
}

const TYPE_COLORS: Record<ListingType, string> = {
  skill: 'bg-blue-50 text-blue-700',
  tool: 'bg-purple-50 text-purple-700',
  event: 'bg-yellow-50 text-yellow-700',
  drive: 'bg-pink-50 text-pink-700',
  food: 'bg-green-50 text-green-700',
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>
}) {
  const { page: rawPage, type: rawType } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const filterType = (['skill', 'tool', 'event', 'drive', 'food'] as ListingType[]).includes(rawType as ListingType)
    ? (rawType as ListingType)
    : null

  let rows: Row[] = []
  let fetchError = false
  let total = 0

  try {
    const offset = (page - 1) * PAGE_SIZE

    const allRows: Row[] = []

    if (!filterType || filterType === 'skill') {
      const r = await db
        .select({ id: skills.id, title: skills.title, status: skills.status, createdAt: skills.createdAt, ownerName: profiles.name })
        .from(skills)
        .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
        .where(isNull(skills.deletedAt))
        .orderBy(desc(skills.createdAt))
      allRows.push(...r.map((x) => ({ ...x, type: 'skill' as const, ownerName: x.ownerName ?? null })))
    }
    if (!filterType || filterType === 'tool') {
      const r = await db
        .select({ id: tools.id, title: tools.title, status: tools.status, createdAt: tools.createdAt, ownerName: profiles.name })
        .from(tools)
        .leftJoin(profiles, eq(profiles.userId, tools.ownerId))
        .where(isNull(tools.deletedAt))
        .orderBy(desc(tools.createdAt))
      allRows.push(...r.map((x) => ({ ...x, type: 'tool' as const, ownerName: x.ownerName ?? null })))
    }
    if (!filterType || filterType === 'event') {
      const r = await db
        .select({ id: events.id, title: events.title, status: events.status, createdAt: events.createdAt, ownerName: profiles.name })
        .from(events)
        .leftJoin(profiles, eq(profiles.userId, events.organizerId))
        .where(isNull(events.deletedAt))
        .orderBy(desc(events.createdAt))
      allRows.push(...r.map((x) => ({ ...x, type: 'event' as const, ownerName: x.ownerName ?? null })))
    }
    if (!filterType || filterType === 'drive') {
      const r = await db
        .select({ id: communityDrives.id, title: communityDrives.title, status: communityDrives.status, createdAt: communityDrives.createdAt, ownerName: profiles.name })
        .from(communityDrives)
        .leftJoin(profiles, eq(profiles.userId, communityDrives.organizerId))
        .where(isNull(communityDrives.deletedAt))
        .orderBy(desc(communityDrives.createdAt))
      allRows.push(...r.map((x) => ({ ...x, type: 'drive' as const, ownerName: x.ownerName ?? null })))
    }
    if (!filterType || filterType === 'food') {
      const r = await db
        .select({ id: foodShares.id, title: foodShares.title, status: foodShares.status, createdAt: foodShares.createdAt, ownerName: profiles.name })
        .from(foodShares)
        .leftJoin(profiles, eq(profiles.userId, foodShares.ownerId))
        .where(isNull(foodShares.deletedAt))
        .orderBy(desc(foodShares.createdAt))
      allRows.push(...r.map((x) => ({ ...x, type: 'food' as const, ownerName: x.ownerName ?? null })))
    }

    allRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    total = allRows.length
    rows = allRows.slice(offset, offset + PAGE_SIZE)
  } catch {
    fetchError = true
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const typeLinks: { label: string; value: string | null }[] = [
    { label: 'All', value: null },
    { label: 'Skills', value: 'skill' },
    { label: 'Tools', value: 'tool' },
    { label: 'Events', value: 'event' },
    { label: 'Drives', value: 'drive' },
    { label: 'Food', value: 'food' },
  ]

  return (
    <div>
      <AdminPageHeader title="Listings" description={`${total} active listing${total !== 1 ? 's' : ''}`} />

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {typeLinks.map(({ label, value }) => {
          const active = filterType === value || (!filterType && value === null)
          const href = value ? `/admin/listings?type=${value}` : '/admin/listings'
          return (
            <a
              key={label}
              href={href}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                active
                  ? 'bg-green-700 border-green-700 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700 bg-white'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      {fetchError && <AdminState title="Could not load listings." message="Check server logs or try refreshing." />}

      {!fetchError && rows.length === 0 && <AdminState title="No listings found." message="Try a different filter." />}

      {!fetchError && rows.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={`${row.type}:${row.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[row.type]}`}>
                        {TYPE_LABELS[row.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{row.title}</td>
                    <td className="px-4 py-3 text-gray-500">{row.ownerName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{row.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <ListingActions id={row.id} type={row.type} title={row.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <AdminPagination
              page={page}
              hasNext={page < totalPages}
              prevHref={filterType ? `/admin/listings?type=${filterType}&page=${page - 1}` : `/admin/listings?page=${page - 1}`}
              nextHref={filterType ? `/admin/listings?type=${filterType}&page=${page + 1}` : `/admin/listings?page=${page + 1}`}
            />
          )}
        </>
      )}
    </div>
  )
}
