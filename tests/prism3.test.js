/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E09000003', async () => await idx.runTest('Barnet'), t)
test('E06000028', async () => await idx.runTest('Bournemouth'), t)
test('E06000036', async () => await idx.runTest('Bracknell Forest'), t)
test('E09000006', async () => await idx.runTest('Bromley'), t)
test('E06000052', async () => await idx.runTest('Cornwall'), t)
test('E08000027', async () => await idx.runTest('Dudley'), t)
test('E08000037', async () => await idx.runTest('Gateshead'), t)
test('E09000011', async () => await idx.runTest('Greenwich'), t)
test('E06000019', async () => await idx.runTest('Herefordshire'), t)
test('E09000019', async () => await idx.runTest('Islington'), t)
test('Jersey', async () => await idx.runTest('Jersey'), t)
test('E10000017', async () => await idx.runTest('Lancashire'), t)
test('E10000019', async () => await idx.runTest('Lincolnshire'), t)
test('E08000012 - Liverpool', async () => await idx.runTest('Liverpool'), t)
test(
  'W06000024',
  async () => await idx.runTest('Merthyr Tudful - Merthyr Tydfil'),
  t
)
test('S12000020', async () => await idx.runTest('Moray'), t)
test('E08000022', async () => await idx.runTest('North Tyneside'), t)
test('E10000023', async () => await idx.runTest('North Yorkshire'), t)
test('S12000023', async () => await idx.runTest('Orkney Islands'), t)
test('E08000028', async () => await idx.runTest('Sandwell'), t)
test('S12000027', async () => await idx.runTest('Shetland Islands'), t)
test('E08000023', async () => await idx.runTest('South Tyneside'), t)
test('E08000030', async () => await idx.runTest('Walsall'), t)
test('E08000015', async () => await idx.runTest('Wirral'), t)
test('E08000031', async () => await idx.runTest('Wolverhampton'), t)
