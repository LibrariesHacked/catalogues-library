/* eslint-env jest */

const index = require('.')

const t = 300000

test('S12000006', async () => await index.runTest('Dumfries and Galloway'), t)
test(
  'W06000009',
  async () => await index.runTest('Sir Benfro - Pembrokeshire'),
  t
)
test('S12000038', async () => await index.runTest('Renfrewshire'), t)
test('E06000021', async () => await index.runTest('Stoke on Trent'), t)
test('E10000031', async () => await index.runTest('Warwickshire'), t)
