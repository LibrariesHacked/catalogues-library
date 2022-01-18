const index = require('../index');

exports.runTest = async (isbn, service) => {
  try {
    let results = await index.availability(isbn, service);
    console.log(results);
    expect(results).not.toHaveLength(0);
    expect(results[0].availability).not.toHaveLength(0);
    expect(results[0].id).toBeTruthy();
    expect(results[0].exception).toBeUndefined();
  }
  catch (e) {
    console.log(e.exception);
    throw e;
  }
}
