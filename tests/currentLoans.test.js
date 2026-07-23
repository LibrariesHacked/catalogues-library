/* eslint-env jest */

import * as index from '../index.js'

test('currentLoans returns a consistent unsupported response shape', async () => {
  const results = await index.currentLoans('test-user', 'test-password', 'Bexley')

  expect(results).toHaveLength(1)
  expect(results[0].service).toBe('Bexley')
  expect(results[0].code).toBe('E09000004')
  expect(results[0].loans).toEqual([])
  expect(results[0].supported).toBe(false)
  expect(results[0].message).toBeTruthy()
  expect(results[0].start).toBeTruthy()
  expect(results[0].end).toBeTruthy()
})