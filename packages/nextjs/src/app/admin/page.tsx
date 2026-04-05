import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { queryAdminUsers, queryAuditLog, queryUserByRefreshToken } from '@/lib/queries/admin'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user || user.role !== 'admin') redirect('/login')

  const [users, audit] = await Promise.all([
    queryAdminUsers(50),
    queryAuditLog(30),
  ])

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Users table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Users ({users.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Verified</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerifiedAt
                      ? <span className="text-green-600">Yes</span>
                      : <span className="text-yellow-600">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.deletedAt
                      ? <span className="text-red-500 text-xs">Deleted</span>
                      : u.lockedUntil && new Date(u.lockedUntil) > new Date()
                      ? <span className="text-orange-500 text-xs">Locked</span>
                      : <span className="text-green-600 text-xs">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit log */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {audit.map((entry) => (
                <tr key={entry.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.userEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      entry.action === 'delete'
                        ? 'bg-red-100 text-red-700'
                        : entry.action === 'create'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {entry.entity ?? '—'}
                    {entry.entityId && (
                      <span className="ml-1 text-xs text-gray-400">
                        {entry.entityId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/" className="text-sm text-gray-400 hover:text-green-700">← Back to site</Link>
    </div>
  )
}
