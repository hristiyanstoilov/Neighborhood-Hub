import { db } from '@/db'
import { contentReports, users, profiles } from '@/db/schema'
import { desc, eq, isNull, isNotNull } from 'drizzle-orm'
import { AdminPageHeader } from '../_components/admin-page-header'
import { AdminPagination } from '../_components/admin-pagination'
import { AdminState } from '../_components/admin-state'
import { formatDateTime } from '@/lib/format'
import { ResolveReportButton } from './_components/resolve-button'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const REASON_LABELS: Record<string, string> = {
  spam:          'Spam',
  inappropriate: 'Inappropriate',
  misleading:    'Misleading',
  other:         'Other',
}

const ENTITY_LABELS: Record<string, string> = {
  skill:           'Skill',
  tool:            'Tool',
  food_share:      'Food Share',
  event:           'Event',
  community_drive: 'Drive',
}

const ENTITY_HREFS: Record<string, string> = {
  skill:           '/skills',
  tool:            '/tools',
  food_share:      '/food',
  event:           '/events',
  community_drive: '/drives',
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: rawPage, status: rawStatus } = await searchParams
  const page   = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const status = rawStatus === 'resolved' ? 'resolved' : 'pending'

  type ReportRow = {
    id: string
    entityType: string
    entityId: string
    reason: string
    resolvedAt: Date | null
    createdAt: Date
    reporterEmail: string | null
    reporterName: string | null
  }

  let rows: ReportRow[] = []
  let fetchError = false

  try {
    rows = await db
      .select({
        id:           contentReports.id,
        entityType:   contentReports.entityType,
        entityId:     contentReports.entityId,
        reason:       contentReports.reason,
        resolvedAt:   contentReports.resolvedAt,
        createdAt:    contentReports.createdAt,
        reporterEmail: users.email,
        reporterName:  profiles.name,
      })
      .from(contentReports)
      .leftJoin(users,    eq(contentReports.reporterId, users.id))
      .leftJoin(profiles, eq(contentReports.reporterId, profiles.userId))
      .where(status === 'pending' ? isNull(contentReports.resolvedAt) : isNotNull(contentReports.resolvedAt))
      .orderBy(desc(contentReports.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
  } catch {
    fetchError = true
  }

  const hasNext = rows.length === PAGE_SIZE

  if (fetchError) {
    return (
      <div>
        <AdminPageHeader title="Content Reports" />
        <AdminState title="Could not load reports." message="Please try refreshing the page." />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <AdminPageHeader title="Content Reports" />
        <div className="flex gap-2 text-sm">
          <a
            href="/admin/reports?status=pending"
            className={`px-3 py-1.5 rounded-md border transition-colors ${
              status === 'pending'
                ? 'bg-green-700 text-white border-green-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending
          </a>
          <a
            href="/admin/reports?status=resolved"
            className={`px-3 py-1.5 rounded-md border transition-colors ${
              status === 'resolved'
                ? 'bg-green-700 text-white border-green-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Resolved
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Reporter</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Content</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              {status === 'pending' && (
                <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const entityHref = `${ENTITY_HREFS[row.entityType] ?? ''}/${row.entityId}`
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{row.reporterName ?? '—'}</p>
                    <p className="text-xs text-gray-400">{row.reporterEmail ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-700">
                      {ENTITY_LABELS[row.entityType] ?? row.entityType}
                    </p>
                    <a
                      href={entityHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:underline font-mono"
                    >
                      {row.entityId.slice(0, 8)}…
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(row.createdAt)}
                  </td>
                  {status === 'pending' && (
                    <td className="px-4 py-3">
                      <ResolveReportButton reportId={row.id} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">
            {status === 'pending' ? 'No pending reports. All clear!' : 'No resolved reports yet.'}
          </p>
        )}
      </div>

      <AdminPagination
        page={page}
        hasNext={hasNext}
        prevHref={`/admin/reports?status=${status}&page=${page - 1}`}
        nextHref={`/admin/reports?status=${status}&page=${page + 1}`}
      />
    </div>
  )
}
