/* eslint-env jest */

const index = require('.')

test('S12000028', async () => await index.runTest('South Ayrshire'), 300000)
