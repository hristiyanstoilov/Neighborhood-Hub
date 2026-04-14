import test from 'node:test'
import assert from 'node:assert/strict'
import { skillRequestsQueryKey, requestActionErrorMessage } from '../packages/nextjs/src/app/(web)/my-requests/_hooks/requests-contract.js'

test('skillRequestsQueryKey is scoped by viewer and role', () => {
  assert.deepEqual(skillRequestsQueryKey('user-1', 'requester'), ['skill-requests', 'user-1', 'requester'])
  assert.deepEqual(skillRequestsQueryKey('user-1', 'owner'), ['skill-requests', 'user-1', 'owner'])
})

test('requestActionErrorMessage maps known API errors', () => {
  assert.equal(requestActionErrorMessage('FORBIDDEN'), 'You are not allowed to perform this action.')
  assert.equal(requestActionErrorMessage('INVALID_TRANSITION'), 'This action is no longer available.')
  assert.equal(requestActionErrorMessage('REQUEST_ALREADY_TERMINAL'), 'This request is already closed.')
  assert.equal(requestActionErrorMessage('TOO_MANY_REQUESTS'), 'Too many attempts. Please wait.')
})

test('requestActionErrorMessage falls back safely', () => {
  assert.equal(requestActionErrorMessage('SOMETHING_ELSE'), 'Something went wrong.')
})
