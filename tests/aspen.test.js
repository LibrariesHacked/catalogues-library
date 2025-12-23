/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('S12000045', async () => await idx.runTest('East Dunbartonshire'), t)
test('E09000020', async () => await idx.runTest('Kensington and Chelsea'), t)
test('E06000002', async () => await idx.runTest('Middlesbrough'), t)
test('S12000013', async () => await idx.runTest('Western Isles'), t)
test('E09000033', async () => await idx.runTest('Westminster'), t)
