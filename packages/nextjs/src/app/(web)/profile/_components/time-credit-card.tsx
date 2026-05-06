import { getTranslations } from 'next-intl/server'

type Props = {
  taught: number
  received: number
}

export async function TimeCreditCard({ taught, received }: Props) {
  const t = await getTranslations('profile')
  const total = taught + received

  if (total === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">{t('time_credit_title')}</p>
      <p className="text-xs text-gray-500 mb-3">{t('time_credit_caption')}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-green-50 py-2">
          <p className="text-xl font-bold text-green-700">{taught}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('time_credit_taught')}</p>
        </div>
        <div className="rounded-md bg-blue-50 py-2">
          <p className="text-xl font-bold text-blue-700">{received}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('time_credit_received')}</p>
        </div>
        <div className="rounded-md bg-gray-50 py-2">
          <p className="text-xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('time_credit_total')}</p>
        </div>
      </div>
    </div>
  )
}
