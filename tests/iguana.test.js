/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('S12000006', async () => await idx.runTest('Dumfries and Galloway'), t)
test('S12000038', async () => await idx.runTest('Renfrewshire'), t)
test('E06000021', async () => await idx.runTest('Stoke on Trent'), t)
