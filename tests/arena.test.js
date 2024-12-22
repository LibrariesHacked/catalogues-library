/* eslint-env jest */

const index = require('.')

test('E06000055 - Bedford', async () => await index.runTest('Bedford'), 300000)
test('E09000004 - Bexley', async () => await index.runTest('Bexley'), 300000)
test(
  'E06000056',
  async () => await index.runTest('Central Bedfordshire'),
  300000
)
test('E08000026', async () => await index.runTest('Coventry'), 300000)
test('E06000005', async () => await index.runTest('Darlington'), 300000)
test('E10000008 - Devon', async () => await index.runTest('Devon'), 300000)
test('E08000017', async () => await index.runTest('Doncaster'), 300000)
test(
  'E06000011',
  async () => await index.runTest('East Riding of Yorkshire'),
  300000
)
test('S12000036', async () => await index.runTest('Edinburgh'), 300000)
test('S12000046', async () => await index.runTest('Glasgow'), 300000)
test('Guernsey', async () => await index.runTest('Guernsey'), 300000)
test('E09000022', async () => await index.runTest('Lambeth'), 300000)
test('E06000016', async () => await index.runTest('Leicester City'), 300000)
test('S12000019', async () => await index.runTest('Midlothian'), 300000)
test(
  'E06000012',
  async () => await index.runTest('North East Lincolnshire'),
  300000
)
test('E06000013', async () => await index.runTest('North Lincolnshire'), 300000)
test(
  'Northern Ireland',
  async () => await index.runTest('Northern Ireland'),
  300000
)
test('E10000021', async () => await index.runTest('Northamptonshire'), 300000)
test('E10000025', async () => await index.runTest('Oxfordshire'), 300000)
test('E06000026', async () => await index.runTest('Plymouth'), 300000)
test(
  'E06000003',
  async () => await index.runTest('Redcar and Cleveland'),
  300000
)
test('E06000051', async () => await index.runTest('Shropshire'), 300000)
test('E06000020', async () => await index.runTest('Telford and Wrekin'), 300000)
test('E06000027', async () => await index.runTest('Torbay'), 300000)
test('E10000032', async () => await index.runTest('West Sussex'), 300000)
test('E06000054', async () => await index.runTest('Wiltshire'), 300000)
