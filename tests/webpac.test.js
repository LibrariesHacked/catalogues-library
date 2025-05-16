/* eslint-env jest */

const idx = require('.')

const t = 300000

test('S12000028', async () => await idx.runTest('South Ayrshire'), t)
