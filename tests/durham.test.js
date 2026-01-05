/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('E06000047', async () => await idx.runTest('Durham'), t)
