/* eslint-env jest */

const index = require('.')

test(
  'E06000010 - Kingston upon Hull',
  async () => await index.runTest('Kingston upon Hull'),
  300000
)
