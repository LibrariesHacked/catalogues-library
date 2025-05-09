/* eslint-env jest */

const idx = require('.')

const t = 300000

test('E06000065', async () => await idx.runTest('North Yorkshire'), t)
test('W06000006', async () => await idx.runTest('Wrecsam - Wrexham'), t)
test('S12000033', async () => await idx.runTest('Aberdeen City'), t)
test('S12000034', async () => await idx.runTest('Aberdeenshire'), t)
test('W06000011', async () => await idx.runTest('Abertawe - Swansea'), t)
test(
  'W06000001',
  async () => await idx.runTest('Sir Ynys Mon - Isle of Anglesey'),
  t
)
test('S12000041', async () => await idx.runTest('Angus'), t)
test('S12000035', async () => await idx.runTest('Argyll and Bute'), t)
test('E08000025', async () => await idx.runTest('Birmingham'), t)
test('E06000009', async () => await idx.runTest('Blackpool'), t)
test('E06000008', async () => await idx.runTest('Blackburn with Darwen'), t)
test('W06000019', async () => await idx.runTest('Blaenau Gwent'), t)
test('E08000001', async () => await idx.runTest('Bolton'), t)
test(
  'W06000013',
  async () => await idx.runTest('Pen-y-bont ar Ogwr - Bridgend'),
  t
)
test('E06000043', async () => await idx.runTest('Brighton and Hove'), t)
test('E10000002', async () => await idx.runTest('Buckinghamshire'), t)
test('E08000002', async () => await idx.runTest('Bury'), t)
test('E08000033', async () => await idx.runTest('Calderdale'), t)
test('E10000003', async () => await idx.runTest('Cambridgeshire'), t)
test('E09000007', async () => await idx.runTest('Camden'), t)
test('W06000015', async () => await idx.runTest('Caerdydd - Cardiff'), t)
test('W06000018', async () => await idx.runTest('Caerphilly'), t)
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
test('W06000003', async () => await idx.runTest('Conwy'), t)
test(
  'W06000004',
  async () => await idx.runTest('Sir Ddinbych - Denbighshire'),
  t
)
test('S12000042', async () => await idx.runTest('Dundee City'), t)
test('S12000010', async () => await idx.runTest('East Lothian'), t)
test('S12000011', async () => await idx.runTest('East Renfrewshire'), t)
test('E10000011', async () => await idx.runTest('East Sussex'), t)
test('S12000014', async () => await idx.runTest('Falkirk'), t)
test('S12000015', async () => await idx.runTest('Fife'), t)
test('W06000005', async () => await idx.runTest('Sir y Fflint - Flintshire'), t)
test('E10000013', async () => await idx.runTest('Gloucestershire'), t)
test('W06000002', async () => await idx.runTest('Gwynedd'), t)
test('E10000014', async () => await idx.runTest('Hampshire'), t)
test('E06000001', async () => await idx.runTest('Hartlepool'), t)
test('E10000015', async () => await idx.runTest('Hertfordshire'), t)
test('S12000017', async () => await idx.runTest('Highland'), t)
test('S12000018', async () => await idx.runTest('Inverclyde'), t)
test('E06000046', async () => await idx.runTest('Isle of Wight'), t)
test('E10000016', async () => await idx.runTest('Kent'), t)
test('E08000003', async () => await idx.runTest('Manchester'), t)
test('E06000035', async () => await idx.runTest('Medway'), t)
test(
  'W06000024',
  async () => await idx.runTest('Merthyr Tudful - Merthyr Tydfil'),
  t
)
test('S12000019', async () => await idx.runTest('Midlothian'), t)
test('E06000042', async () => await idx.runTest('Milton Keynes'), t)
test('W06000021', async () => await idx.runTest('Sir Fynwy - Monmouthshire'), t)
test('S12000020', async () => await idx.runTest('Moray'), t)
test(
  'W06000012',
  async () => await idx.runTest('Castell-nedd Port Talbot - Neath Port Talbot'),
  t
)
test('W06000022', async () => await idx.runTest('Casnewydd - Newport'), t)
test('E10000020', async () => await idx.runTest('Norfolk'), t)
test('S12000021', async () => await idx.runTest('North Ayrshire'), t)
test('S12000044', async () => await idx.runTest('North Lanarkshire'), t)

test('E06000057', async () => await idx.runTest('Northumberland'), t)
test('E08000004', async () => await idx.runTest('Oldham'), t)
test('S12000023', async () => await idx.runTest('Orkney Islands'), t)
test('S12000024', async () => await idx.runTest('Perth and Kinross'), t)
test('E06000031', async () => await idx.runTest('Peterborough'), t)
test('E06000044', async () => await idx.runTest('Portsmouth'), t)
test('W06000023', async () => await idx.runTest('Powys'), t)
test('E06000038', async () => await idx.runTest('Reading'), t)
test('W06000016', async () => await idx.runTest('Rhondda Cynon Taf'), t)
test('E09000027', async () => await idx.runTest('Richmond upon Thames'), t)
test('E08000005', async () => await idx.runTest('Rochdale'), t)
test('E08000006', async () => await idx.runTest('Salford'), t)
test('S12000026', async () => await idx.runTest('Scottish Borders'), t)
test('S12000027', async () => await idx.runTest('Shetland Islands'), t)
test('E06000039', async () => await idx.runTest('Slough'), t)
test('E08000029', async () => await idx.runTest('Solihull'), t)
test('S12000029', async () => await idx.runTest('South Lanarkshire'), t)
test('E06000045', async () => await idx.runTest('Southampton'), t)
test('E06000033', async () => await idx.runTest('Southend on Sea'), t)
test('E09000028', async () => await idx.runTest('Southwark'), t)
test('S12000030', async () => await idx.runTest('Stirling'), t)
test('E0800000', async () => await idx.runTest('Stockport'), t)
test('E06000004', async () => await idx.runTest('Stockton on Tees'), t)
test('E10000029', async () => await idx.runTest('Suffolk'), t)
test('E06000030', async () => await idx.runTest('Swindon'), t)
test('E08000008', async () => await idx.runTest('Tameside'), t)
test('W06000020', async () => await idx.runTest('Tor-faen - Torfaen'), t)
test('E08000009', async () => await idx.runTest('Trafford'), t)
test(
  'W06000014',
  async () => await idx.runTest('Bro Morgannwg - the Vale of Glamorgan'),
  t
)
test('E06000037', async () => await idx.runTest('West Berkshire'), t)
test('E08000010', async () => await idx.runTest('Wigan'), t)
test('E06000040', async () => await idx.runTest('Windsor & Maidenhead'), t)
test('E06000041', async () => await idx.runTest('Wokingham'), t)
