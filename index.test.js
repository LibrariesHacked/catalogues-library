const index = require('./index')

test('prism_availability', async () => {
  const availability = await index.availability('9781843103912', 'Barnet')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('arena_availability', async () => {
  const availability = await index.availability('9781408855911', 'Glasgow')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('all_services', async () => {
  const availability = await index.testIsbnSearch()
  expect(availability).not.toHaveLength(0)
}, 300000)
