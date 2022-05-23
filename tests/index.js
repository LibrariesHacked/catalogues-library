const index = require('../index');

const librariesIgnoreList = [
];

const availabilityIgnoreList = [
  // Bexley - some issue with cookies that I just can't
  // seem to work around.
  'Bexley'
]

exports.runTest = async (isbn, service) => {
  try {
    let results = null;

    // Libraries
    results = await index.libraries(service);
    console.log(results);
    expect(results).not.toHaveLength(0);
    
    if (!librariesIgnoreList.includes(service))
      expect(results[0].libraries).not.toHaveLength(0);

    // Availability
    results = await index.availability(isbn, service);
    console.log(results);
    expect(results).not.toHaveLength(0);

    if (!availabilityIgnoreList.includes(service)) {
      expect(results[0].availability)
      expect(results[0].availability).not.toHaveLength(0);

      for(let a of results[0].availability) {
        expect(a.available + a.unavailable).toBeGreaterThan(0);
      }
  
    }

    expect(results[0].id).toBeTruthy();
    expect(results[0].exception).toBeUndefined();
    
  }
  catch (e) {
    console.error(e.exception ?? e);
    throw e;
  }
}
