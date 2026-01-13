/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('E10000024', async () => await idx.runTest('Nottinghamshire'), t)

