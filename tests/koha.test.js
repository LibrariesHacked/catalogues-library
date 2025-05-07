/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E06000049', async () => await idx.runTest('Cheshire East'), t)
test('E06000050', async () => await idx.runTest('Cheshire West and Chester'), t)
test('S12000005', async () => await idx.runTest('Clackmannanshire'), t)
test('E10000006', async () => await idx.runTest('Cumbria'), t)
test('E06000006', async () => await idx.runTest('Halton'), t)
test('E08000011', async () => await idx.runTest('Knowsley'), t)
test('E08000021', async () => await idx.runTest('Newcastle upon Tyne'), t)
test('E08000014', async () => await idx.runTest('Sefton'), t)
test('E08000013', async () => await idx.runTest('St Helens'), t)
test('E06000007', async () => await idx.runTest('Warrington'), t)
test('S12000013', async () => await idx.runTest('Western Isles'), t)
