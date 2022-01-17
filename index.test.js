const index = require('./index')

test('arena_availability', async () => {
  const results = await index.availability('9781526618283', 'Lambeth')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('blackpool_availability', async () => {
  const results = await index.availability('9781408865415', 'Blackpool')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('durham_availability', async () => {
  const results = await index.availability('9780747538486', 'Durham')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('enterprise_availability', async () => {
  const results = await index.availability('9780747538493', 'Barnsley')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('ibistro_availability', async () => {
  const results = await index.availability('9780747538493', 'Kingston upon Hull')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('iguana_availability', async () => {
  const results = await index.availability('9780747562184', 'Warwickshire')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('koha_availability', async () => {
  const results = await index.availability('9781907545009', 'Clackmannanshire')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('prism_availability', async () => {
  const results = await index.availability('9781408855928', 'Barnet')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('spydus_availability', async () => {
  const results = await index.availability('9780751565355', 'Aberdeenshire')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)

test('webpac_availability', async () => {
  const results = await index.availability('9780751565362', 'South Ayrshire')
  console.log(results)
  expect(results).not.toHaveLength(0)
  expect(results[0].availability).not.toHaveLength(0)
  expect(results[0].id).toBeTruthy()
}, 30000)
/*
test('all_services', async () => {
  const availability = await index.testIsbnSearch()
  expect(availability).not.toHaveLength(0)
}, 300000)
*/