/* eslint-env jest */

const index = require('.')

test('S12000033', async () => await index.runTest('Aberdeen City'), 300000)
test('S12000034', async () => await index.runTest('Aberdeenshire'), 300000)
test('S12000041', async () => await index.runTest('Angus'), 300000)
test('S12000035', async () => await index.runTest('Argyll and Bute'), 300000)
test('E08000025', async () => await index.runTest('Birmingham'), 300000)
test('E06000009', async () => await index.runTest('Blackpool'), 300000)
test(
  'E06000008',
  async () => await index.runTest('Blackburn with Darwen'),
  300000
)
test('E08000001', async () => await index.runTest('Bolton'), 300000)
test('E06000043', async () => await index.runTest('Brighton and Hove'), 300000)
test('E10000002', async () => await index.runTest('Buckinghamshire'), 300000)
test('E08000002', async () => await index.runTest('Bury'), 300000)
test('E08000033', async () => await index.runTest('Calderdale'), 300000)
test('E10000003', async () => await index.runTest('Cambridgeshire'), 300000)
test('E09000007', async () => await index.runTest('Camden'), 300000)
test('S12000042', async () => await index.runTest('Dundee City'), 300000)
test('S12000010', async () => await index.runTest('East Lothian'), 300000)
test('S12000011', async () => await index.runTest('East Renfrewshire'), 300000)
test('E10000011', async () => await index.runTest('East Sussex'), 300000)
test('S12000014', async () => await index.runTest('Falkirk'), 300000)
test('S12000015', async () => await index.runTest('Fife'), 300000)
test('E10000013', async () => await index.runTest('Gloucestershire'), 300000)
test('E10000014', async () => await index.runTest('Hampshire'), 300000)
test('E06000001', async () => await index.runTest('Hartlepool'), 300000)
test('E10000015', async () => await index.runTest('Hertfordshire'), 300000)
test('S12000017', async () => await index.runTest('Highland'), 300000)
test('S12000018', async () => await index.runTest('Inverclyde'), 300000)
test('E06000046', async () => await index.runTest('Isle of Wight'), 300000)
test('E10000016', async () => await index.runTest('Kent'), 300000)
test('E08000003', async () => await index.runTest('Manchester'), 300000)
test('E06000035', async () => await index.runTest('Medway'), 300000)
test('E06000042', async () => await index.runTest('Milton Keynes'), 300000)
test('E10000020', async () => await index.runTest('Norfolk'), 300000)
test('S12000021', async () => await index.runTest('North Ayrshire'), 300000)
test('S12000044', async () => await index.runTest('North Lanarkshire'), 300000)
test('E06000057', async () => await index.runTest('Northumberland'), 300000)
test('E08000004', async () => await index.runTest('Oldham'), 300000)
test('S12000024', async () => await index.runTest('Perth and Kinross'), 300000)
test('E06000031', async () => await index.runTest('Peterborough'), 300000)
test('E06000044', async () => await index.runTest('Portsmouth'), 300000)
test('E06000038', async () => await index.runTest('Reading'), 300000)
test(
  'E09000027',
  async () => await index.runTest('Richmond upon Thames'),
  300000
)
test('E08000005', async () => await index.runTest('Rochdale'), 300000)
test('E08000006', async () => await index.runTest('Salford'), 300000)
test('S12000026', async () => await index.runTest('Scottish Borders'), 300000)
test('E06000039', async () => await index.runTest('Slough'), 300000)
test('E08000029', async () => await index.runTest('Solihull'), 300000)
test('S12000029', async () => await index.runTest('South Lanarkshire'), 300000)
test('E06000045', async () => await index.runTest('Southampton'), 300000)
test('E06000033', async () => await index.runTest('Southend on Sea'), 300000)
test('E09000028', async () => await index.runTest('Southwark'), 300000)
test('S12000030', async () => await index.runTest('Stirling'), 300000)
test('E0800000', async () => await index.runTest('Stockport'), 300000)
test('E06000004', async () => await index.runTest('Stockton on Tees'), 300000)
test('E10000029', async () => await index.runTest('Suffolk'), 300000)
test('E06000030', async () => await index.runTest('Swindon'), 300000)
test('E08000008', async () => await index.runTest('Tameside'), 300000)
test('E08000009', async () => await index.runTest('Trafford'), 300000)
test('E06000037', async () => await index.runTest('West Berkshire'), 300000)
test('E08000010', async () => await index.runTest('Wigan'), 300000)
test(
  'E06000040',
  async () => await index.runTest('Windsor & Maidenhead'),
  300000
)
test('E06000041', async () => await index.runTest('Wokingham'), 300000)
