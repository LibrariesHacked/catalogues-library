/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('E06000032', async () => await idx.runTest('Luton'), t)
test('E09000029', async () => await idx.runTest('Sutton'), t)
test('E08000024', async () => await idx.runTest('Sunderland'), t)
