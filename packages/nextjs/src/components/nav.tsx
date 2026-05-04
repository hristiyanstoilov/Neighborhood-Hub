'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Logo from '@/components/logo'
import NotificationsBell from '@/components/notifications-bell'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'

const DEMO_USER_EMAIL = 'demo@neighborhoodhub.bg'

export default function Nav() {
  const t = useTranslations('nav')
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isDemoUser = user?.email?.toLowerCase() === DEMO_USER_EMAIL

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  function navLinkClass(path: string) {
    return isActive(path)
      ? 'font-medium text-green-700 transition-colors'
      : 'text-gray-600 hover:text-green-700 transition-colors'
  }

  function mobileLinkClass(path: string) {
    return `block px-4 py-3 text-sm rounded-md transition-colors ${
      isActive(path)
        ? 'font-medium text-green-700 bg-green-50'
        : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
    }`
  }

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  // Escape / outside-click close for desktop dropdown
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

  // Escape to close mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    setSearchValue(q)
  }, [pathname])

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchValue.trim()
    router.push(query.length >= 2 ? `/search?q=${encodeURIComponent(query)}` : '/search')
    setMobileMenuOpen(false)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const MODULE_LINKS = [
    { href: '/skills',      label: t('skills')      },
    { href: '/tools',       label: t('tools')       },
    { href: '/events',      label: t('events')      },
    { href: '/drives',      label: t('drives')      },
    { href: '/food',        label: t('food')        },
    { href: '/feed',        label: t('feed')        },
    { href: '/map',         label: t('map')         },
    { href: '/leaderboard', label: t('leaderboard') },
    { href: '/messages',    label: t('messages')    },
    { href: '/radar',       label: t('radar')       },
  ]

  const MY_LINKS = [
    { href: '/my-requests',      label: t('my_requests')          },
    { href: '/my-reservations',  label: t('my_tool_reservations') },
    { href: '/food/reservations', label: t('my_food_reservations') },
    { href: '/my-events',        label: t('my_events')            },
    { href: '/my-drives',        label: t('my_pledges')           },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" aria-label="Neighborhood Hub home" className="shrink-0">
          <Logo variant="light" height={32} />
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:block">
          <label htmlFor="global-search" className="sr-only">Search</label>
          <input
            id="global-search"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('search')}
            className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </form>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-4 text-sm" aria-label="Primary">
          {MODULE_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={navLinkClass(href)}>
              {label}
            </Link>
          ))}

          <LanguageSwitcher />

          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className={navLinkClass('/admin')}>
                      {t('admin')}
                    </Link>
                  )}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="text-gray-600 hover:text-green-700 transition-colors flex items-center gap-1 text-sm"
                      aria-haspopup="menu"
                      aria-expanded={dropdownOpen}
                    >
                      {t('my_activity')}
                      <span aria-hidden="true">▾</span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
                        {MY_LINKS.map(({ href, label }) => (
                          <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setDropdownOpen(false)} className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-green-700 ${isActive(href) ? 'text-green-700' : 'text-gray-700'}`}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link href="/chat" aria-current={isActive('/chat') ? 'page' : undefined} className={navLinkClass('/chat')}>{t('ai_chat')}</Link>
                  <NotificationsBell />
                  <Link href="/profile" aria-current={isActive('/profile') ? 'page' : undefined} className={navLinkClass('/profile')}>{user.profile?.name ?? user.email}</Link>
                  <button type="button" onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">{t('logout')}</button>
                </>
              ) : (
                <>
                  <Link href="/login" aria-current={isActive('/login') ? 'page' : undefined} className={navLinkClass('/login')}>{t('login')}</Link>
                  <Link href="/register" className="bg-green-700 text-white px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors">{t('register')}</Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile right-side controls */}
        <div className="lg:hidden flex items-center gap-2">
          {user && <NotificationsBell />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? t('close_menu') : t('open_menu')}
            className="p-2 text-gray-600 hover:text-green-700 transition-colors rounded-md"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemoUser && (
        <div className="border-t border-yellow-200 bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-900">
          {t('demo_mode_banner')}
        </div>
      )}

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-panel" className="lg:hidden border-t border-gray-200 bg-white">
          {/* Mobile search */}
          <div className="px-4 pt-4 pb-2">
            <form onSubmit={handleSearchSubmit}>
              <label htmlFor="mobile-search" className="sr-only">Search</label>
              <input
                id="mobile-search"
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('search')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </form>
          </div>

          {/* Explore links */}
          <div className="px-3 pb-2">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('section_explore')}</p>
            {MODULE_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={mobileLinkClass(href)}>
                {label}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          {!loading && (
            <div className="px-3 border-t border-gray-100 pb-4">
              {user ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('my_activity')}</p>
                  {MY_LINKS.map(({ href, label }) => (
                    <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={mobileLinkClass(href)}>
                      {label}
                    </Link>
                  ))}
                  <Link href="/chat" aria-current={isActive('/chat') ? 'page' : undefined} className={mobileLinkClass('/chat')}>{t('ai_chat')}</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" aria-current={isActive('/admin') ? 'page' : undefined} className={mobileLinkClass('/admin')}>{t('admin')}</Link>
                  )}
                  <div className="mt-1 border-t border-gray-100 pt-2 px-1 flex items-center justify-between">
                    <Link href="/profile" className={mobileLinkClass('/profile')}>{user.profile?.name ?? user.email}</Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('section_account')}</p>
                  <Link href="/login" className={mobileLinkClass('/login')}>{t('login')}</Link>
                  <Link href="/register" className="block mx-4 mt-2 bg-green-700 text-white text-sm font-medium text-center px-4 py-2.5 rounded-md hover:bg-green-800 transition-colors">
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="px-4 pb-3">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  )
}
