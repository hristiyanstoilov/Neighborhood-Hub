import type { SkillListFilters } from './use-skills-list'

export function skillListQueryKey(filters: SkillListFilters) {
  return [
    'skills',
    filters.page,
    filters.status ?? '',
    filters.search ?? '',
    filters.categoryId ?? '',
    filters.locationId ?? '',
  ] as const
}

export function buildSkillsHref(
  current: Partial<SkillListFilters>,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams()
  const merged: Record<string, string | undefined> = {
    status: current.status,
    search: current.search,
    categoryId: current.categoryId,
    locationId: current.locationId,
    ...overrides,
  }

  for (const [key, value] of Object.entries(merged)) {
    if (value && key !== 'page') {
      params.set(key, value)
    }
  }

  const page = overrides.page
  if (page) params.set('page', page)

  const qs = params.toString()
  return qs ? `/skills?${qs}` : '/skills'
}
