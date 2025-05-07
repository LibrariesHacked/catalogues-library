/* eslint-env expect */
/* global expect */

const index = require('../index')
const tests = require('./tests.json')

const librariesIgnoreList = [
  // Only has "All Locations" option
  'Southampton'
]

exports.runTest = async service => {
  try {
    let results = null

    // Libraries
    if (!librariesIgnoreList.includes(service)) {
      results = await index.libraries(service)
      expect(results).not.toHaveLength(0)
      expect(results[0].libraries).not.toHaveLength(0)
    }

    // Availability

    /*
    The sequence of ISBNs is generally as follows:

    1. Harry Potter and the Philosopher's Stone
    2. Nineteen Eighty Four
    3. Pride and Prejudice
    4. Hamlet
    5. Gangsta Granny

    Where a library doesn't have one of the above books, a similar book
    has been substituted: another J K Rowling, Jane Austin or David Walliams
    book, for example.

    The following libraries do not have ISBNs available for availability checks:

      - Bexley - some issue with cookies that I just can't seem to work around.
    */

    const isbns = tests.find(x => x.Name === service).ISBNs

    if (!isbns || isbns.length === 0) {
      // Tests are either disabled or don't exist.
      return
    }

    results = []

    for (const isbn of isbns) {
      results = await index.availability(isbn, service)

      // Just need one of the five ISBNs to return results (some books may go out of circulation).
      if (results && results.length > 0 && results[0].availability.length > 0) {
        break
      }
    }

    expect(results).not.toHaveLength(0)
    expect(results[0].availability)
    expect(results[0].availability).not.toHaveLength(0)

    for (const a of results[0].availability) {
      expect(a.available + a.unavailable).toBeGreaterThan(0)
    }
    expect(results[0].id).toBeTruthy()
    expect(results[0].exception).toBeUndefined()
  } catch (e) {}
}
