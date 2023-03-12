const index = require('.');

test('E06000032 - Luton', async () => await index.runTest('Luton'), 300000);
test('E09000029 - Sutton', async () => await index.runTest('Sutton'), 300000);
