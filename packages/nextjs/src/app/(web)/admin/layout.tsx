import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/admin')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/admin')
  if (user.role !== 'admin') redirect('/')

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-green-700 transition-colors"
    >
      {label}
    </Link>
  )

  return (
    <div className="flex gap-8 min-h-[60vh]">
      {/* Sidebar */}
      <aside className="w-44 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Admin</p>
        <nav className="space-y-1">
          {navLink('/admin/dashboard', 'Dashboard')}
          {navLink('/admin/users',     'Users')}
          {navLink('/admin/reports',   'Reports')}
          {navLink('/admin/audit',     'Audit Log')}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
