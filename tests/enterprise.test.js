/* eslint-env jest */

const idx = require('.')

const t = 300000

test(
  'W06000001',
  async () => await idx.runTest('Sir Ynys Mon - Isle of Anglesey'),
  t
)
test('E09000002', async () => await idx.runTest('Barking and Dagenham'), t)
test('E08000016', async () => await idx.runTest('Barnsley'), t)
test('W06000019', async () => await idx.runTest('Blaenau Gwent'), t)
test('E08000032', async () => await idx.runTest('Bradford'), t)
test('E09000005', async () => await idx.runTest('Brent'), t)
test(
  'W06000013',
  async () => await idx.runTest('Pen-y-bont ar Ogwr - Bridgend'),
  t
)
test('W06000018', async () => await idx.runTest('Caerphilly'), t)
test('W06000015', async () => await idx.runTest('Caerdydd - Cardiff'), t)
test(
  'W06000010',
  async () => await idx.runTest('Sir Gaerfyrddin - Carmarthenshire'),
  t
)
test(
  'W06000008',
  async () => await idx.runTest('Sir Ceredigion - Ceredigion'),
  t
)
test('E09000001', async () => await idx.runTest('City of London'), t)
test('W06000003', async () => await idx.runTest('Conwy'), t)
test('E09000008', async () => await idx.runTest('Croydon'), t)
test(
  'W06000004',
  async () => await idx.runTest('Sir Ddinbych - Denbighshire'),
  t
)
test('E09000009', async () => await idx.runTest('Ealing'), t)
test('S12000008', async () => await idx.runTest('East Ayrshire'), t)
test('E09000010', async () => await idx.runTest('Enfield'), t)
test('E10000012', async () => await idx.runTest('Essex'), t)
test('W06000005', async () => await idx.runTest('Sir y Fflint - Flintshire'), t)
test('W06000002', async () => await idx.runTest('Gwynedd'), t)
test('E09000012', async () => await idx.runTest('Hackney'), t)
test('E09000013', async () => await idx.runTest('Hammersmith and Fulham'), t)
test('E09000014', async () => await idx.runTest('Haringey'), t)
test('E09000015', async () => await idx.runTest('Harrow'), t)
test('E09000016', async () => await idx.runTest('Havering'), t)
test('E09000017', async () => await idx.runTest('Hillingdon'), t)
test('E09000018', async () => await idx.runTest('Hounslow'), t)
test('E09000020', async () => await idx.runTest('Kensington and Chelsea'), t)
test('E06000010', async () => await idx.runTest('Kingston upon Hull'), t)
test('E09000021', async () => await idx.runTest('Kingston upon Thames'), t)
test('E08000034', async () => await idx.runTest('Kirklees'), t)
test('E08000035', async () => await idx.runTest('Leeds'), t)
test('E09000023', async () => await idx.runTest('Lewisham'), t)
test('E09000024', async () => await idx.runTest('Merton'), t)
test('W06000021', async () => await idx.runTest('Sir Fynwy - Monmouthshire'), t)
test(
  'W06000012',
  async () => await idx.runTest('Castell-nedd Port Talbot - Neath Port Talbot'),
  t
)
test('E09000025', async () => await idx.runTest('Newham'), t)
test('W06000022', async () => await idx.runTest('Casnewydd - Newport'), t)
test('E06000029', async () => await idx.runTest('Poole'), t)
test('W06000023', async () => await idx.runTest('Powys'), t)
test('E09000026', async () => await idx.runTest('Redbridge'), t)
test('W06000016', async () => await idx.runTest('Rhondda Cynon Taf'), t)
test('E08000018', async () => await idx.runTest('Rotherham'), t)
test('E08000019', async () => await idx.runTest('Sheffield'), t)
test('E10000028', async () => await idx.runTest('Staffordshire'), t)
test('E10000030', async () => await idx.runTest('Surrey'), t)
test('E06000034', async () => await idx.runTest('Thurrock'), t)
test('E09000030', async () => await idx.runTest('Tower Hamlets'), t)
test('E08000036', async () => await idx.runTest('Wakefield'), t)
test('E09000031', async () => await idx.runTest('Waltham Forest'), t)
test('S12000039', async () => await idx.runTest('West Dunbartonshire'), t)
test('S12000040', async () => await idx.runTest('West Lothian'), t)
test('E10000034', async () => await idx.runTest('Worcestershire'), t)
test('E06000014', async () => await idx.runTest('York City'), t)
