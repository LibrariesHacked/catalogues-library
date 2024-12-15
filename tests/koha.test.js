/* eslint-env jest */

const index = require('.')

test(
  'E06000049 - Cheshire East',
  async () => await index.runTest('Cheshire East'),
  300000
)
test(
  'E06000050 - Cheshire West and Chester',
  async () => await index.runTest('Cheshire West and Chester'),
  300000
)
test(
  'S12000005 - Clackmannanshire',
  async () => await index.runTest('Clackmannanshire'),
  300000
)
test('E10000006 - Cumbria', async () => await index.runTest('Cumbria'), 300000)
test(
  'S12000045 - East Dunbartonshire',
  async () => await index.runTest('East Dunbartonshire'),
  300000
)
test('E06000006 - Halton', async () => await index.runTest('Halton'), 300000)
test(
  'E08000011 - Knowsley',
  async () => await index.runTest('Knowsley'),
  300000
)
test(
  'E06000002 - Middlesbrough',
  async () => await index.runTest('Middlesbrough'),
  300000
)
test(
  'E08000021 - Newcastle upon Tyne',
  async () => await index.runTest('Newcastle upon Tyne'),
  300000
)
test('E08000014 - Sefton', async () => await index.runTest('Sefton'), 300000)
test(
  'E08000013 - St Helens',
  async () => await index.runTest('St Helens'),
  300000
)
test(
  'E06000007 - Warrington',
  async () => await index.runTest('Warrington'),
  300000
)
test(
  'S12000013 - Western Isles',
  async () => await index.runTest('Western Isles'),
  300000
)
