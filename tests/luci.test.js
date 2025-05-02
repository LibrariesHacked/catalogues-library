/* eslint-env jest */

const idx = require('.')

test('E06000032 - Luton', async () => await idx.runTest('Luton'), 300000)
test('E09000029 - Sutton', async () => await idx.runTest('Sutton'), 300000)
