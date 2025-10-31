/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E10000008', async () => await idx.runTest('Devon'), t)