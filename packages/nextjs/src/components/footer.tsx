import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('nav')
  const tFooter = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{tFooter('col_explore')}</p>
            <ul className="space-y-2">
              {[
                { href: '/skills',  label: t('skills')  },
                { href: '/tools',   label: t('tools')   },
                { href: '/events',  label: t('events')  },
                { href: '/drives',  label: t('drives')  },
                { href: '/food',    label: t('food')    },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-green-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{tFooter('col_community')}</p>
            <ul className="space-y-2">
              {[
                { href: '/feed',        label: t('feed')        },
                { href: '/leaderboard', label: t('leaderboard') },
                { href: '/map',         label: t('map')         },
                { href: '/radar',       label: t('radar')       },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-green-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{tFooter('col_support')}</p>
            <ul className="space-y-2">
              {[
                { href: '/contact', label: tFooter('contact') },
                { href: '/help',    label: tFooter('help')    },
                { href: '/guidelines', label: tFooter('guidelines') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-green-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{tFooter('col_legal')}</p>
            <ul className="space-y-2">
              {[
                { href: '/privacy', label: tFooter('privacy')  },
                { href: '/terms',   label: tFooter('terms')    },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-green-700 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 text-center">
          <p className="text-sm text-gray-400">© {year} Neighborhood Hub — {tFooter('tagline')}</p>
        </div>
      </div>
    </footer>
  )
}
