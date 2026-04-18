import Link from 'next/link'

const NAV_LINKS = [
  { href: '/skills',  label: 'Skills'  },
  { href: '/tools',   label: 'Tools'   },
  { href: '/events',  label: 'Events'  },
  { href: '/drives',  label: 'Drives'  },
  { href: '/register', label: 'Sign up' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          © {year} Neighborhood Hub. Built for Bulgarian communities.
        </p>

        <nav className="flex items-center gap-5" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-500 hover:text-green-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
