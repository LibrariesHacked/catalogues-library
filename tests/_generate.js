const data = require('../data/data.json')
const fs = require('fs')
 
test('generate_tests', () => {
  generateTests('arena');
  generateTests('blackpool');
  generateTests('durham');
  generateTests('enterprise');
  generateTests('ibistro');
  generateTests('iguana');
  generateTests('koha');
  generateTests('prism3');
  generateTests('spydus');
  generateTests('webpac');
}, 300000)

const generateTests = (provider) => {
  let libraries = data.LibraryServices.filter(x => x.Type == provider);
  let output = 'const index = require(\'.\');\n\n';

  for (let library of libraries) {
    output += `test('${library.Code} - ${library.Name}', async () => await index.runTest('${library.TestISBN}', '${library.Name}'), 300000);` + '\n';
  }

  fs.writeFileSync(`./tests/${provider}.test.js`, output);
}