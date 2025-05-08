/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E10000031', async () => await idx.runTest('Warwickshire'), t)
test('E06000054', async () => await idx.runTest('Wiltshire'), t)
test(
  'E06000022',
  async () => await idx.runTest('Bath and North East Somerset'),
  t
)
test('E06000055', async () => await idx.runTest('Bedford'), t)
test('E09000004', async () => await idx.runTest('Bexley'), t)
test('E06000028', async () => await idx.runTest('Bournemouth'), t)
test('E06000023', async () => await idx.runTest('Bristol City'), t)
test('E06000056', async () => await idx.runTest('Central Bedfordshire'), t)
test('E08000026', async () => await idx.runTest('Coventry'), t)
test('E06000005', async () => await idx.runTest('Darlington'), t)
test('E06000015', async () => await idx.runTest('Derby City'), t)
test('E10000007', async () => await idx.runTest('Derbyshire'), t)
test('E10000008', async () => await idx.runTest('Devon'), t)
test('E08000017', async () => await idx.runTest('Doncaster'), t)
test('E10000009', async () => await idx.runTest('Dorset'), t)
test('E06000011', async () => await idx.runTest('East Riding of Yorkshire'), t)
test('S12000036', async () => await idx.runTest('Edinburgh'), t)
test('S12000046', async () => await idx.runTest('Glasgow'), t)
test('Guernsey', async () => await idx.runTest('Guernsey'), t)
test('E09000022', async () => await idx.runTest('Lambeth'), t)
test('E06000016', async () => await idx.runTest('Leicester City'), t)
test('E10000018', async () => await idx.runTest('Leicestershire'), t)
test('E06000012', async () => await idx.runTest('North East Lincolnshire'), t)
test('E06000013', async () => await idx.runTest('North Lincolnshire'), t)
test('Northern Ireland', async () => await idx.runTest('Northern Ireland'), t)
test('E10000021', async () => await idx.runTest('Northamptonshire'), t)
test('E06000018', async () => await idx.runTest('Nottingham City'), t)
test('E10000024', async () => await idx.runTest('Nottinghamshire'), t)
test('E06000024', async () => await idx.runTest('North Somerset'), t)
test('E10000025', async () => await idx.runTest('Oxfordshire'), t)
test('E06000026', async () => await idx.runTest('Plymouth'), t)
test('E06000003', async () => await idx.runTest('Redcar and Cleveland'), t)
test('E06000017', async () => await idx.runTest('Rutland'), t)
test('E06000051', async () => await idx.runTest('Shropshire'), t)
test('E10000027', async () => await idx.runTest('Somerset'), t)
test('E06000025', async () => await idx.runTest('South Gloucestershire'), t)
test('E06000020', async () => await idx.runTest('Telford and Wrekin'), t)
test('E06000027', async () => await idx.runTest('Torbay'), t)
test('E10000032', async () => await idx.runTest('West Sussex'), t)
