const index = require('./index')

test('arena_availability', async () => {
  const availability = await index.availability('9781408855911', 'Glasgow')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('blackpool_availability', async () => {
  const availability = await index.availability('9781408865415', 'Blackpool')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('durham_availability', async () => {
  const response = await index.availability('9780747538486', 'Durham')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('enterprise_availability', async () => {
  const response = await index.availability('9780747538493', 'Barnsley')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('ibistro_availability', async () => {
  const response = await index.availability('9780747538493', 'Kingston upon Hull')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('iguana_availability', async () => {
  const response = await index.availability('9780747562184', 'Warwickshire')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('koha_availability', async () => {
  const response = await index.availability('9781907545009', 'Clackmannanshire')
  expect(response).not.toHaveLength(0)
  if (response.length > 0) expect(response[0].availability).not.toHaveLength(0)
}, 30000)

test('prism_availability', async () => {
  const availability = await index.availability('9781843103912', 'Barnet')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('spydus_availability', async () => {
  const availability = await index.availability('9780751565355', 'Aberdeenshire')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('webpac_availability', async () => {
  const availability = await index.availability('9780751565362', 'South Ayrshire')
  expect(availability).not.toHaveLength(0)
}, 30000)

test('all_services', async () => {
  const availability = await index.testIsbnSearch()
  expect(availability).not.toHaveLength(0)
}, 300000)
