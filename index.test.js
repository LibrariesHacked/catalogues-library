const index = require('./index')

test('prism_availability', async () => {
  const availability = await index.availability('9781843103912', 'Barnet')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('arena_availability', async () => {
  const availability = await index.availability('9781408855911', 'Glasgow')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('durham_availability', async () => {
  const response = await index.availability('9780747538486', 'Durham')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('all_services', async () => {
  const availability = await index.testIsbnSearch()
  expect(availability).not.toHaveLength(0)
}, 300000)
