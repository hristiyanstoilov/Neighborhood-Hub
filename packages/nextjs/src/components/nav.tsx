'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Logo from '@/components/logo'
import NotificationsBell from '@/components/notifications-bell'

export default function Nav() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <Logo variant="light" height={32} />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/skills" className="text-gray-600 hover:text-green-700 transition-colors">
            Skills
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="text-gray-600 hover:text-green-700 transition-colors">
                      Admin
                    </Link>
                  )}
                  <Link href="/my-requests" className="text-gray-600 hover:text-green-700 transition-colors">
                    My Requests
                  </Link>
                  <Link href="/chat" className="text-gray-600 hover:text-green-700 transition-colors">
                    AI Chat
                  </Link>
                  <NotificationsBell />
                  <Link href="/profile" className="text-gray-600 hover:text-green-700 transition-colors">
                    {user.profile?.name ?? user.email}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-green-700 transition-colors">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-green-700 text-white px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
