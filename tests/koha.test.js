const index = require('.');

test('E06000049 - Cheshire East', async () => await index.runTest('9781408869178', 'Cheshire East'), 300000);
test('E06000050 - Cheshire West and Chester', async () => await index.runTest('9781408845660', 'Cheshire West and Chester'), 300000);
test('S12000005 - Clackmannanshire', async () => await index.runTest('9781907545009', 'Clackmannanshire'), 300000);
test('E10000006 - Cumbria', async () => await index.runTest('9781408855713', 'Cumbria'), 300000);
test('S12000045 - East Dunbartonshire', async () => await index.runTest('9781408810576', 'East Dunbartonshire'), 300000);
test('E06000006 - Halton', async () => await index.runTest('9780751565355', 'Halton'), 300000);
test('E08000011 - Knowsley', async () => await index.runTest('9781408855959', 'Knowsley'), 300000);
test('E06000002 - Middlesbrough', async () => await index.runTest('9781408810606', 'Middlesbrough'), 300000);
test('E08000021 - Newcastle upon Tyne', async () => await index.runTest('9781408855713', 'Newcastle upon Tyne'), 300000);
test('E08000014 - Sefton', async () => await index.runTest('9780751565355', 'Sefton'), 300000);
test('E08000013 - St Helens', async () => await index.runTest('9781408855706', 'St Helens'), 300000);
test('E06000007 - Warrington', async () => await index.runTest('9780747561071', 'Warrington'), 300000);
test('S12000013 - Western Isles', async () => await index.runTest('9780751565355', 'Western Isles'), 300000);
