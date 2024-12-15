/* eslint-env jest */

const index = require('.')

test(
  'S12000006 - Dumfries and Galloway',
  async () => await index.runTest('Dumfries and Galloway'),
  300000
)
test(
  'W06000009 - Sir Benfro - Pembrokeshire',
  async () => await index.runTest('Sir Benfro - Pembrokeshire'),
  300000
)
test(
  'S12000038 - Renfrewshire',
  async () => await index.runTest('Renfrewshire'),
  300000
)
test(
  'S12000026 - Scottish Borders',
  async () => await index.runTest('Scottish Borders'),
  300000
)
test(
  'E06000021 - Stoke on Trent',
  async () => await index.runTest('Stoke on Trent'),
  300000
)
test(
  'E10000031 - Warwickshire',
  async () => await index.runTest('Warwickshire'),
  300000
)
