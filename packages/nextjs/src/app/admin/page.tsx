import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'

interface AdminUser {
  id: string
  email: string
  role: string
  emailVerifiedAt: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  deletedAt: string | null
  createdAt: string
  name: string | null
}

interface AuditEntry {
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  entity: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

async function getAdminData(accessToken: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL

  const [usersRes, auditRes] = await Promise.all([
    fetch(`${base}/api/admin/users?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
    fetch(`${base}/api/admin/audit?limit=30`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
  ])

  if (usersRes.status === 401 || usersRes.status === 403) return null
  if (!usersRes.ok || !auditRes.ok) return null

  const [usersJson, auditJson] = await Promise.all([usersRes.json(), auditRes.json()])

  return {
    users: (usersJson.data ?? []) as AdminUser[],
    audit: (auditJson.data ?? []) as AuditEntry[],
  }
}

async function getAccessToken(): Promise<string | null> {
  // In server components we can't access the in-memory token,
  // so we call /api/auth/refresh using the httpOnly cookie
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) return null

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: `refresh_token=${refreshToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data?.accessToken ?? null
}

export default async function AdminPage() {
  const accessToken = await getAccessToken()
  if (!accessToken) redirect('/login')

  const data = await getAdminData(accessToken)
  if (!data) redirect('/login')

  const { users, audit } = data

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
                        : 'bg-blue-100 text-blue-700'
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

      <Link href="/" className="text-sm text-gray-400 hover:text-blue-600">← Back to site</Link>
    </div>
  )
}
