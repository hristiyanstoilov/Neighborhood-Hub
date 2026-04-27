import { useTranslations } from 'next-intl'

export function ProfileEmailWarning() {
  const t = useTranslations('profile')

  return (
    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 mt-4">
      {t('email_warning')}
    </p>
  )
}