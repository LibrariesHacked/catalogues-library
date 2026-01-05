/* eslint-env jest */

import * as idx from './index.js'

const t = 300000

test('S12000028', async () => await idx.runTest('South Ayrshire'), t)
