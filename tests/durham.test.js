/* eslint-env jest */

const index = require('.')

const t = 300000

test('E06000047', async () => await index.runTest('Durham'), t)
