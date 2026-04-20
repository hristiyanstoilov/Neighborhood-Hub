'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Logo from '@/components/logo'
import NotificationsBell from '@/components/notifications-bell'

export default function Nav() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  useEffect(() => {
    if (!dropdownOpen) return

    function handleMouseDown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    setSearchValue(q)
  }, [pathname])

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchValue.trim()
    if (query.length < 2) {
      router.push('/search')
      setMobileSearchOpen(false)
      return
    }

    router.push(`/search?q=${encodeURIComponent(query)}`)
    setMobileSearchOpen(false)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" aria-label="Neighborhood Hub home">
          <Logo variant="light" height={32} />
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden lg:block">
          <label htmlFor="global-search" className="sr-only">Search</label>
          <input
            id="global-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search skills, tools, events..."
            className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </form>

        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
          <button
            type="button"
            className="lg:hidden text-gray-600 hover:text-green-700 transition-colors"
            onClick={() => setMobileSearchOpen((open) => !open)}
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-search-panel"
          >
            Search
          </button>
          <Link
            href="/skills"
            aria-current={isActive('/skills') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Skills
          </Link>
          <Link
            href="/tools"
            aria-current={isActive('/tools') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Tools
          </Link>
          <Link
            href="/events"
            aria-current={isActive('/events') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/drives"
            aria-current={isActive('/drives') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Drives
          </Link>
          <Link
            href="/food"
            aria-current={isActive('/food') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Food
          </Link>
          <Link
            href="/feed"
            aria-current={isActive('/feed') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/messages"
            aria-current={isActive('/messages') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Messages
          </Link>
          <Link
            href="/radar"
            aria-current={isActive('/radar') ? 'page' : undefined}
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Radar
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      aria-current={isActive('/admin') ? 'page' : undefined}
                      className="text-gray-600 hover:text-green-700 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((open) => !open)}
                      className="text-gray-600 hover:text-green-700 transition-colors flex items-center gap-1 text-sm"
                      aria-haspopup="menu"
                      aria-expanded={dropdownOpen}
                    >
                      My Activity
                      <span aria-hidden="true">▾</span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
                        <Link
                          href="/my-requests"
                          aria-current={isActive('/my-requests') ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/my-requests') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          My Requests
                        </Link>
                        <Link
                          href="/my-reservations"
                          aria-current={isActive('/my-reservations') ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/my-reservations') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          My Tool Reservations
                        </Link>
                        <Link
                          href="/food/reservations"
                          aria-current={isActive('/food/reservations') ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/food/reservations') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          My Food Reservations
                        </Link>
                        <Link
                          href="/my-events"
                          aria-current={isActive('/my-events') ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/my-events') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          My Events
                        </Link>
                        <Link
                          href="/my-drives"
                          aria-current={isActive('/my-drives') ? 'page' : undefined}
                          onClick={() => setDropdownOpen(false)}
                          className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive('/my-drives') ? 'text-green-700' : 'text-gray-700'}`}
                        >
                          My Pledges
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/chat"
                    aria-current={isActive('/chat') ? 'page' : undefined}
                    className="text-gray-600 hover:text-green-700 transition-colors"
                  >
                    AI Chat
                  </Link>
                  <NotificationsBell />
                  <Link
                    href="/profile"
                    aria-current={isActive('/profile') ? 'page' : undefined}
                    className="text-gray-600 hover:text-green-700 transition-colors"
                  >
                    {user.profile?.name ?? user.email}
                  </Link>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    aria-current={isActive('/login') ? 'page' : undefined}
                    className="text-gray-600 hover:text-green-700 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    aria-current={isActive('/register') ? 'page' : undefined}
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

      {mobileSearchOpen && (
        <div id="mobile-search-panel" className="lg:hidden border-t border-gray-200 bg-white px-4 py-3">
          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="mobile-global-search" className="sr-only">Search</label>
            <input
              id="mobile-global-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search skills, tools, events..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </form>
        </div>
      )}
    </header>
  )
}
