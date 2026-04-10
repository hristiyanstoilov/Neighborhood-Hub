import { db } from '@/db'
import { auditLog } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { AdminPageHeader } from '../_components/admin-page-header'
import { AdminPagination } from '../_components/admin-pagination'
import { AdminState } from '../_components/admin-state'
import { formatDateTime, humanizeValue } from '@/lib/format'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  type AuditRow = {
    id: string
    userId: string | null
    userEmail: string | null
    action: string
    entity: string | null
    entityId: string | null
    metadata: unknown
    ipAddress: string | null
    createdAt: Date
  }

  let rows: AuditRow[] = []
  let fetchError = false

  try {
    rows = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        userEmail: auditLog.userEmail,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        metadata: auditLog.metadata,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
  } catch {
    fetchError = true
  }

  const hasNext = rows.length === PAGE_SIZE

  const ACTION_COLORS: Record<string, string> = {
    create:         'bg-green-100 text-green-700',
    update:         'bg-blue-100 text-blue-700',
    delete:         'bg-red-100 text-red-700',
    login:          'bg-gray-100 text-gray-600',
    logout:         'bg-gray-100 text-gray-600',
    register:       'bg-purple-100 text-purple-700',
    verify_email:   'bg-teal-100 text-teal-700',
    reset_password: 'bg-orange-100 text-orange-700',
  }

  if (fetchError) {
    return (
      <div>
        <AdminPageHeader title="Audit Log" />
        <AdminState title="Could not load audit log." message="Please try refreshing the page." />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Audit Log" />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Entity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-700">{row.userEmail ?? '—'}</p>
                  {row.ipAddress && (
                    <p className="text-xs text-gray-400">{row.ipAddress}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[row.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {humanizeValue(row.action)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {row.entity ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                  {row.metadata
                    ? JSON.stringify(row.metadata)
                    : row.entityId ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">No audit entries found.</p>
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        hasNext={hasNext}
        prevHref={`/admin/audit?page=${page - 1}`}
        nextHref={`/admin/audit?page=${page + 1}`}
      />
    </div>
  )
}
