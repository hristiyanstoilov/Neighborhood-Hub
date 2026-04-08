import { db } from '@/db'
import { users, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import UserActions from './user-actions'
import { AdminPageHeader } from '../_components/admin-page-header'
import { AdminPagination } from '../_components/admin-pagination'
import { AdminState } from '../_components/admin-state'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

type UserRow = {
  id: string
  email: string
  role: 'user' | 'admin'
  emailVerifiedAt: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  deletedAt: Date | null
  createdAt: Date
  name: string | null
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let rows: UserRow[] = []
  let fetchError = false

  try {
    rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
        deletedAt: users.deletedAt,
        createdAt: users.createdAt,
        name: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
  } catch {
    fetchError = true
  }

  const hasNext = rows.length === PAGE_SIZE

  function fmt(date: Date | string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function isLocked(row: UserRow) {
    return row.lockedUntil != null && new Date(row.lockedUntil) > new Date()
  }

  if (fetchError) {
    return (
      <div>
        <AdminPageHeader title="Users" />
        <AdminState title="Could not load users." message="Please try refreshing the page." />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Users" />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Verified</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className={row.deletedAt ? 'opacity-40' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{row.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{row.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    row.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.emailVerifiedAt
                    ? <span className="text-green-600 text-xs">Yes</span>
                    : <span className="text-yellow-600 text-xs">No</span>}
                </td>
                <td className="px-4 py-3">
                  {row.deletedAt
                    ? <span className="text-xs text-red-500">Deleted</span>
                    : isLocked(row)
                    ? <span className="text-xs text-orange-600">Locked</span>
                    : <span className="text-xs text-gray-400">Active</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(row.createdAt)}</td>
                <td className="px-4 py-3">
                  {!row.deletedAt && (
                    <UserActions
                      userId={row.id}
                      currentRole={row.role}
                      isLocked={isLocked(row)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">No users found.</p>
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        hasNext={hasNext}
        prevHref={`/admin/users?page=${page - 1}`}
        nextHref={`/admin/users?page=${page + 1}`}
      />
    </div>
  )
}
