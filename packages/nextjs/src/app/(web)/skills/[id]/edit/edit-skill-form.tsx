'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface SkillData {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  locationId: string | null
  availableHours: number | null
  status: string
}

interface Category { id: string; slug: string; label: string }
interface Location { id: string; city: string; neighborhood: string }

interface Props {
  skill: SkillData
  categories: Category[]
  locations: Location[]
}

export default function EditSkillForm({ skill, categories, locations }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleLength, setTitleLength] = useState(skill.title?.length ?? 0)
  const [descLength, setDescLength] = useState(skill.description?.length ?? 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const availableHoursRaw = form.get('availableHours') as string
      const body = {
        title:          form.get('title') as string,
        description:    (form.get('description') as string) || undefined,
        categoryId:     (form.get('categoryId') as string) || undefined,
        locationId:     (form.get('locationId') as string) || undefined,
        availableHours: availableHoursRaw ? parseInt(availableHoursRaw, 10) : undefined,
        status:         form.get('status') as string,
      }

      const res = await apiFetch(`/api/skills/${skill.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          UNAUTHORIZED:       t('errors.unauthorized'),
          FORBIDDEN:          t('errors.forbidden'),
          NOT_FOUND:          t('errors.not_found'),
          VALIDATION_ERROR:   t('errors.validation'),
          CATEGORY_NOT_FOUND: t('errors.category_not_found'),
          LOCATION_NOT_FOUND: t('errors.location_not_found'),
          TOO_MANY_REQUESTS:  t('errors.too_many_requests'),
        }
        setError(msg[json.error] ?? t('errors.unexpected'))
        return
      }

      showToast({
        variant: 'success',
        title: t('toast_saved_title'),
        message: t('toast_saved_message'),
      })
      router.push(`/skills/${skill.id}`)
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="edit-skill-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_title_label')} <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-skill-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            defaultValue={skill.title}
            onChange={(e) => setTitleLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{titleLength}/200</p>
        </div>

        <div>
          <label htmlFor="edit-skill-status" className="block text-sm font-medium text-gray-700 mb-1">{t('form_status_label')}</label>
          <select
            id="edit-skill-status"
            name="status"
            defaultValue={skill.status}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="available">{tCommon('status.available')}</option>
            <option value="busy">{tCommon('status.busy')}</option>
            <option value="retired">{tCommon('status.retired')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="edit-skill-description" className="block text-sm font-medium text-gray-700 mb-1">{t('form_desc_label')}</label>
          <textarea
            id="edit-skill-description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={skill.description ?? ''}
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{descLength}/2000</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-skill-category" className="block text-sm font-medium text-gray-700 mb-1">{t('field_category')}</label>
            <select
              id="edit-skill-category"
              name="categoryId"
              defaultValue={skill.categoryId ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_category_placeholder')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-skill-location" className="block text-sm font-medium text-gray-700 mb-1">{t('field_location')}</label>
            <select
              id="edit-skill-location"
              name="locationId"
              defaultValue={skill.locationId ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">{t('form_location_placeholder')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-40">
          <label htmlFor="edit-skill-hours" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form_hours_label')}
          </label>
          <input
            id="edit-skill-hours"
            name="availableHours"
            type="number"
            min={0}
            max={168}
            defaultValue={skill.availableHours ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('form_saving') : t('form_save')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/skills/${skill.id}`)}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
