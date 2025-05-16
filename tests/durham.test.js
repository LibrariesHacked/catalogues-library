/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E06000047', async () => await idx.runTest('Durham'), t)
