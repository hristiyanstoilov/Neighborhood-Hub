import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('nav')
  const tFooter = await getTranslations('footer')
  const year = new Date().getFullYear()

  const NAV_LINKS = [
    { href: '/skills',   label: t('skills')   },
    { href: '/tools',    label: t('tools')    },
    { href: '/events',   label: t('events')   },
    { href: '/drives',   label: t('drives')   },
    { href: '/food',     label: t('food')     },
    { href: '/register', label: t('register') },
  ]

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          © {year} Neighborhood Hub. {tFooter('tagline')}
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
