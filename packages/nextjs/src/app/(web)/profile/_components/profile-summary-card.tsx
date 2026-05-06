'use client'

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
      avgRating?: string | null
      ratingCount?: number | null
    } | null
  }
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  const t = useTranslations('profile')
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        {user.profile?.avatarUrl ? (
          <Image
            src={user.profile.avatarUrl}
            alt={user.profile.name ?? t('avatar_alt')}
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
        {(user.profile?.ratingCount ?? 0) > 0 && (
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500">{t('community_rating')}</dt>
            <dd className="font-medium text-amber-700">
              ★ {Number(user.profile?.avgRating).toFixed(1)} ({user.profile?.ratingCount} {t('reviews')})
            </dd>
          </div>
        )}
        {user.profile?.bio && (
          <div className="py-3">
            <dt className="text-gray-500 mb-1">{t('bio')}</dt>
            <dd className="text-gray-700">{user.profile.bio}</dd>
          </div>
        )}
      </dl>

      <div className="pt-2 grid grid-cols-2 gap-2">
        {([
          { href: '/my-requests',       key: 'my_requests' },
          { href: '/my-reservations',   key: 'my_tool_reservations' },
          { href: '/food/reservations', key: 'my_food_reservations' },
          { href: '/my-events',         key: 'my_events' },
          { href: '/my-drives',         key: 'my_pledges' },
        ] as const).map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            className="text-center px-3 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors"
          >
            {t(key)}
          </Link>
        ))}
      </div>
    </div>
  )
}
