import Link from 'next/link'

const MODULE_LINKS = [
  { href: '/skills',  label: 'Skills'  },
  { href: '/tools',   label: 'Tools'   },
  { href: '/events',  label: 'Events'  },
  { href: '/drives',  label: 'Drives'  },
  { href: '/food',    label: 'Food'    },
]

const LEGAL_LINKS = [
  { href: '/privacy',           label: 'Privacy Policy'  },
  { href: '/terms',             label: 'Terms of Service' },
  { href: '/help',              label: 'Help'             },
  { href: '/for-municipalities', label: 'For Municipalities' },
  { href: '/contact',           label: 'Contact'          },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <nav className="flex flex-wrap justify-center gap-5" aria-label="Footer modules">
          {MODULE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-500 hover:text-green-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            © {year} Neighborhood Hub. Built for Bulgarian communities.
          </p>

          <nav className="flex flex-wrap items-center gap-4" aria-label="Footer legal">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-gray-500 hover:text-green-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
