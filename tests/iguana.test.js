const index = require('.');

test('E08000026 - Coventry', async () => await index.runTest('9781408855669', 'Coventry'), 300000);
test('S12000006 - Dumfries and Galloway', async () => await index.runTest('9781408855669', 'Dumfries and Galloway'), 300000);
test('S12000044 - North Lanarkshire', async () => await index.runTest('9780747574477', 'North Lanarkshire'), 300000);
test('W06000009 - Sir Benfro - Pembrokeshire', async () => await index.runTest('9780751565355', 'Sir Benfro - Pembrokeshire'), 300000);
test('S12000038 - Renfrewshire', async () => await index.runTest('9781785301544', 'Renfrewshire'), 300000);
test('S12000026 - Scottish Borders', async () => await index.runTest('9781408855690', 'Scottish Borders'), 300000);
test('E06000021 - Stoke on Trent', async () => await index.runTest('9781408855690', 'Stoke on Trent'), 300000);
test('E10000031 - Warwickshire', async () => await index.runTest('9780747562184', 'Warwickshire'), 300000);
