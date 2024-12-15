/* eslint-env jest */

const index = require('.')

test('E06000047 - Durham', async () => await index.runTest('Durham'), 300000)
