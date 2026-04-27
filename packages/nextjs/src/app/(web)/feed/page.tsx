import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FeedList } from './_components/feed-list'

export const metadata: Metadata = {
  title: 'Neighborhood Feed',
}

export default async function FeedPage() {
  const t = await getTranslations('feed')

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-600">{t('subtitle')}</p>
      </div>
      <FeedList />
    </div>
  )
}
