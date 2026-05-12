'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, Bot, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import Logo from '@/components/logo'
import NotificationsBell from '@/components/notifications-bell'

const DISCOVER_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/radar', label: 'Radar' },
  { href: '/map', label: 'Map' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default function Nav() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const discoverRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  useEffect(() => {
    if (!discoverOpen && !profileOpen) return

    function handleMouseDown(event: MouseEvent) {
      if (discoverRef.current && !discoverRef.current.contains(event.target as Node)) {
        setDiscoverOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDiscoverOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [discoverOpen, profileOpen])

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Left: Logo + core module links */}
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Neighborhood Hub home">
            <Logo variant="light" height={32} />
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm" aria-label="Primary">
            {['skills', 'tools', 'events', 'drives', 'food'].map((seg) => (
              <Link
                key={seg}
                href={`/${seg}`}
                aria-current={isActive(`/${seg}`) ? 'page' : undefined}
                className={`capitalize transition-colors ${
                  isActive(`/${seg}`) ? 'text-green-700 font-medium' : 'text-gray-600 hover:text-green-700'
                }`}
              >
                {seg.charAt(0).toUpperCase() + seg.slice(1)}
              </Link>
            ))}

            {/* Discover dropdown */}
            <div className="relative" ref={discoverRef}>
              <button
                type="button"
                onClick={() => setDiscoverOpen((o) => !o)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  DISCOVER_LINKS.some((l) => isActive(l.href))
                    ? 'text-green-700 font-medium'
                    : 'text-gray-600 hover:text-green-700'
                }`}
                aria-haspopup="menu"
                aria-expanded={discoverOpen}
              >
                Discover
                <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${discoverOpen ? 'rotate-180' : ''}`} />
              </button>

              {discoverOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
                  {DISCOVER_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                      onClick={() => setDiscoverOpen(false)}
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${
                        isActive(link.href) ? 'text-green-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: auth-dependent cluster */}
        <div className="flex items-center gap-1">
          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      aria-current={isActive('/admin') ? 'page' : undefined}
                      className="px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      Admin
                    </Link>
                  )}

                  {/* Messages icon */}
                  <Link
                    href="/messages"
                    aria-label="Messages"
                    aria-current={isActive('/messages') ? 'page' : undefined}
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
                      isActive('/messages') ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
                    }`}
                  >
                    <MessageSquare size={18} aria-hidden="true" />
                  </Link>

                  {/* AI Chat icon */}
                  <Link
                    href="/chat"
                    aria-label="AI Chat"
                    aria-current={isActive('/chat') ? 'page' : undefined}
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
                      isActive('/chat') ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
                    }`}
                  >
                    <Bot size={18} aria-hidden="true" />
                  </Link>

                  {/* Notifications bell (existing component, unchanged) */}
                  <NotificationsBell />

                  {/* Profile dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((o) => !o)}
                      className={`flex items-center gap-1 p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
                        profileOpen || isActive('/profile') ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
                      }`}
                      aria-label={`${user.profile?.name ?? user.email} — account menu`}
                      aria-haspopup="menu"
                      aria-expanded={profileOpen}
                    >
                      <User size={18} aria-hidden="true" />
                      <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[200px]">
                        {/* User identity header */}
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-900 truncate">{user.profile?.name ?? 'My Account'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>

                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          aria-current={isActive('/profile') ? 'page' : undefined}
                          className={`block px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/profile') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          View Profile
                        </Link>

                        <div className="border-t border-gray-100 my-1" />

                        {[
                          { href: '/my-requests',      label: 'My Requests'           },
                          { href: '/my-reservations',   label: 'My Tool Reservations'  },
                          { href: '/food/reservations', label: 'My Food Reservations'  },
                          { href: '/my-events',         label: 'My Events'             },
                          { href: '/my-drives',         label: 'My Pledges'            },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setProfileOpen(false)}
                            aria-current={isActive(item.href) ? 'page' : undefined}
                            className={`block px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive(item.href) ? 'text-green-700' : 'text-gray-700'}`}
                          >
                            {item.label}
                          </Link>
                        ))}

                        <div className="border-t border-gray-100 my-1" />

                        <button
                          type="button"
                          onClick={async () => { setProfileOpen(false); await handleLogout() }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    aria-current={isActive('/login') ? 'page' : undefined}
                    className="text-sm text-gray-600 hover:text-green-700 transition-colors px-2"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    aria-current={isActive('/register') ? 'page' : undefined}
                    className="text-sm bg-green-700 text-white px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
