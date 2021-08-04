const index = require('./index');

test('prism_availability_individual_service', async () => {
  const availability = await index.availability('9781843103912', 'Barnet')
  expect(availability).not.toHaveLength(0)
})

test('all_services', async () => {
  const availability = await index.testIsbnSearch()
  expect(availability).not.toHaveLength(0)
}, 300000)