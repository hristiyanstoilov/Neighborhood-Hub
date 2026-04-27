import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function ProfilePageHeader() {
  const t = useTranslations('profile')

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <div className="flex gap-2">
        <Link
          href="/profile/skills"
          className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('my_skills_link')}
        </Link>
        <Link
          href="/profile/edit"
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
        >
          {t('edit')}
        </Link>
      </div>
    </div>
  )
}