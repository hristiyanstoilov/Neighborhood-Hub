import test from 'node:test'
import assert from 'node:assert/strict'
import { skillListQueryKey, buildSkillsHref } from '../packages/nextjs/src/app/(web)/skills/_hooks/skills-contract.ts'

test('skillListQueryKey is stable and filter-scoped', () => {
  assert.deepEqual(
    skillListQueryKey({ page: 1, status: 'available', search: 'carpentry', categoryId: 'cat-1', locationId: 'loc-2' }),
    ['skills', 1, 'available', 'carpentry', 'cat-1', 'loc-2']
  )

  assert.deepEqual(
    skillListQueryKey({ page: 2, status: undefined, search: undefined, categoryId: undefined, locationId: undefined }),
    ['skills', 2, '', '', '', '']
  )
})

test('buildSkillsHref preserves filters and resets page unless overridden', () => {
  const current = {
    status: 'available',
    search: 'tutor',
    categoryId: 'cat-1',
    locationId: 'loc-2',
    page: '3',
  }

  assert.equal(
    buildSkillsHref(current, { categoryId: 'cat-9' }),
    '/skills?status=available&search=tutor&categoryId=cat-9&locationId=loc-2'
  )

  assert.equal(
    buildSkillsHref(current, { page: undefined, status: undefined, search: undefined, categoryId: undefined, locationId: undefined }),
    '/skills'
  )

  assert.equal(buildSkillsHref(current, { page: '1' }), '/skills?status=available&search=tutor&categoryId=cat-1&locationId=loc-2&page=1')
})
