/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E06000023', async () => await idx.runTest('Bristol City'), t)