const index = require('.');

test('S12000033 - Aberdeen City', async () => await index.runTest('9780747560821', 'Aberdeen City'), 300000);
test('S12000034 - Aberdeenshire', async () => await index.runTest('9780751565355', 'Aberdeenshire'), 300000);
test('S12000041 - Angus', async () => await index.runTest('9780747538493', 'Angus'), 300000);
test('S12000035 - Argyll and Bute', async () => await index.runTest('9781408855669', 'Argyll and Bute'), 300000);
test('E08000025 - Birmingham', async () => await index.runTest('9780747538493', 'Birmingham'), 300000);
test('E06000008 - Blackburn with Darwen', async () => await index.runTest('9781408855713', 'Blackburn with Darwen'), 300000);
test('E08000001 - Bolton', async () => await index.runTest('9781408890776', 'Bolton'), 300000);
test('E06000043 - Brighton and Hove', async () => await index.runTest('9780747562184', 'Brighton and Hove'), 300000);
test('E10000002 - Buckinghamshire', async () => await index.runTest('9781408855713', 'Buckinghamshire'), 300000);
test('E08000033 - Calderdale', async () => await index.runTest('9780751565362', 'Calderdale'), 300000);
test('E10000003 - Cambridgeshire', async () => await index.runTest('9780747538493', 'Cambridgeshire'), 300000);
test('E09000007 - Camden', async () => await index.runTest('9780747538493', 'Camden'), 300000);
test('S12000042 - Dundee City', async () => await index.runTest('9780747538493', 'Dundee City'), 300000);
test('S12000011 - East Renfrewshire', async () => await index.runTest('9781785301544', 'East Renfrewshire'), 300000);
test('E10000011 - East Sussex', async () => await index.runTest('9780747538486', 'East Sussex'), 300000);
test('E10000013 - Gloucestershire', async () => await index.runTest('9781408855713', 'Gloucestershire'), 300000);
test('E10000014 - Hampshire', async () => await index.runTest('9781408845646', 'Hampshire'), 300000);
test('E10000015 - Hertfordshire', async () => await index.runTest('9781408834985', 'Hertfordshire'), 300000);
test('S12000017 - Highland', async () => await index.runTest('9780751565355', 'Highland'), 300000);
test('S12000018 - Inverclyde', async () => await index.runTest('9781408865408', 'Inverclyde'), 300000);
test('E06000046 - Isle of Wight', async () => await index.runTest('9780747538493', 'Isle of Wight'), 300000);
test('E10000016 - Kent', async () => await index.runTest('9780747538493', 'Kent'), 300000);
test('E08000003 - Manchester', async () => await index.runTest('9780751565362', 'Manchester'), 300000);
test('E06000035 - Medway', async () => await index.runTest('9780747538493', 'Medway'), 300000);
test('E06000042 - Milton Keynes', async () => await index.runTest('9781510051317', 'Milton Keynes'), 300000);
test('E10000020 - Norfolk', async () => await index.runTest('9780747591085', 'Norfolk'), 300000);
test('S12000021 - North Ayrshire', async () => await index.runTest('9781408855713', 'North Ayrshire'), 300000);
test('E06000057 - Northumberland', async () => await index.runTest('9781408855959', 'Northumberland'), 300000);
test('E08000004 - Oldham', async () => await index.runTest('9781408835005', 'Oldham'), 300000);
test('S12000024 - Perth and Kinross', async () => await index.runTest('9781785301544', 'Perth and Kinross'), 300000);
test('E06000031 - Peterborough', async () => await index.runTest('9780747573760', 'Peterborough'), 300000);
test('E06000044 - Portsmouth', async () => await index.runTest('9781408810576', 'Portsmouth'), 300000);
test('E06000038 - Reading', async () => await index.runTest('9780751565355', 'Reading'), 300000);
test('E09000027 - Richmond upon Thames', async () => await index.runTest('9780751565362', 'Richmond upon Thames'), 300000);
test('E08000005 - Rochdale', async () => await index.runTest('9781408855676', 'Rochdale'), 300000);
test('E08000006 - Salford', async () => await index.runTest('9781408855706', 'Salford'), 300000);
test('E06000039 - Slough', async () => await index.runTest('9781408855669', 'Slough'), 300000);
test('E08000029 - Solihull', async () => await index.runTest('9780751565362', 'Solihull'), 300000);
test('S12000029 - South Lanarkshire', async () => await index.runTest('9780747538493', 'South Lanarkshire'), 300000);
test('E06000045 - Southampton', async () => await index.runTest('9781408855676', 'Southampton'), 300000);
test('E06000033 - Southend on Sea', async () => await index.runTest('9781408855713', 'Southend on Sea'), 300000);
test('E09000028 - Southwark', async () => await index.runTest('9781408898147', 'Southwark'), 300000);
test('E08000007 - Stockport', async () => await index.runTest('9781408855669', 'Stockport'), 300000);
test('E06000004 - Stockton on Tees', async () => await index.runTest('9781408845677', 'Stockton on Tees'), 300000);
test('E10000029 - Suffolk', async () => await index.runTest('9781526622808', 'Suffolk'), 300000);
test('E06000030 - Swindon', async () => await index.runTest('9781408845660', 'Swindon'), 300000);
test('E08000008 - Tameside', async () => await index.runTest('9780751565355', 'Tameside'), 300000);
test('E08000009 - Trafford', async () => await index.runTest('9780751565355', 'Trafford'), 300000);
test('E06000037 - West Berkshire', async () => await index.runTest('9780747599876', 'West Berkshire'), 300000);
test('E06000040 - Windsor & Maidenhead', async () => await index.runTest('9781510051317', 'Windsor & Maidenhead'), 300000);
test('E06000041 - Wokingham', async () => await index.runTest('9781408845653', 'Wokingham'), 300000);