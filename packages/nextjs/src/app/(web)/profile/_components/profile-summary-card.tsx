import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type ProfileSummaryCardProps = {
  user: {
    email: string
    role: string
    emailVerifiedAt: string | null
    profile?: {
      avatarUrl?: string | null
      name?: string | null
      bio?: string | null
      isPublic?: boolean | null
    } | null
  }
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  const t = useTranslations('profile')
  const tNav = useTranslations('nav')

  const quickLinks = [
    { href: '/my-requests',       label: tNav('my_requests') },
    { href: '/my-reservations',   label: tNav('my_tool_reservations') },
    { href: '/food/reservations', label: tNav('my_food_reservations') },
    { href: '/my-events',         label: tNav('my_events') },
    { href: '/my-drives',         label: tNav('my_pledges') },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        {user.profile?.avatarUrl ? (
          <Image
            src={user.profile.avatarUrl}
            alt={user.profile.name ?? 'Avatar'}
            width={56}
            height={56}
            unoptimized
            className="w-14 h-14 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
            {(user.profile?.name ?? user.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{user.profile?.name ?? '—'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <dl className="divide-y divide-gray-100 text-sm">
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">{t('role')}</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
        </div>
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">{t('email_verified')}</dt>
          <dd className={user.emailVerifiedAt ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
            {user.emailVerifiedAt ? t('verified') : t('not_verified')}
          </dd>
        </div>
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">{t('visibility')}</dt>
          <dd className="font-medium">
            {user.profile?.isPublic === false ? t('private') : t('public')}
          </dd>
        </div>
        {user.profile?.bio && (
          <div className="py-3">
            <dt className="text-gray-500 mb-1">{t('bio')}</dt>
            <dd className="text-gray-700">{user.profile.bio}</dd>
          </div>
        )}
      </dl>

      <div className="pt-2 grid grid-cols-2 gap-2">
        {quickLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-center px-3 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}