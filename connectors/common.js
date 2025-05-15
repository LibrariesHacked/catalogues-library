/**
 * The majority of the get service call is just returning information that's in the service
 * object from data.json.  Maintain a list here of what to return.
 * @param {object} service
 */
exports.getService = function (service) {
  return {
    code: service.Code,
    name: service.Name,
    type: service.Type,
    url: service.Url
  }
}

/**
 * Used for error handling and checking HTTP status
 * @param {*} error
 * @param {*} httpMessage
 */
exports.handleErrors = function (error, httpMessage) {
  if (httpMessage && (httpMessage.statusCode !== 200 && httpMessage.statusCode !== 302)) error = 'Web request error. Status code was ' + httpMessage.statusCode
  if (error) return true
  return false
}

/**
 * Test if a string is json
 * @param {string} str
 */
exports.isJsonString = function (str) {
  try {
    JSON.parse(str)
  } catch (e) { return false }
  return true
}

/**
 * Test if a string is a library
 * @param {string} str
 */
exports.isLibrary = function (str) {
  const nonLibraries = [
    'ALL',
    'ANY',
    'ADULT BOOKS',
    'ALL BRANCHES',
    'ALL HULL CITY LIBRARIES',
    'ALL LOCATIONS',
    'ALL LIBRARIES',
    'ALL',
    'ANY LIBRARY',
    'AUDIO BOOKS',
    'CHILDREN\'S BOOKS',
    'CHOOSE ONE',
    'DVDS',
    'FICTION',
    'HERE',
    'INVALID KEY',
    'LARGE PRINT',
    'LOCAL HISTORY',
    'NON-FICTION',
    'SCHOOL LIBRARIES COLLECTIONS',
    'SELECT AN ALTERNATIVE',
    'SELECT BRANCH',
    'SELECT DEFAULT BRANCH',
    'SELECT LIBRARY',
    'VIEW ENTIRE COLLECTION',
    'YOUNG ADULT COLLECTION'
  ]
  return !nonLibraries.includes(str.toUpperCase())
}

/**
 * Creates a new object to store results for the get libraries request
 * @param {object} service
 */
exports.initialiseGetLibrariesResponse = function (service) {
  const response = { service: service.Name, code: service.Code, libraries: [], start: new Date(), end: null }
  // Sometimes we have to use libraries that are hardcoded into the config
  if (service.Libraries) {
    for (const lib in service.Libraries) response.libraries.push(lib)
  }
  return response
}

/**
 * Creates a new object to store search results for the ISBN search
 * @param {object} service
 */
exports.initialiseSearchByISBNResponse = function (service) {
  return { id: null, service: service.Name, code: service.Code, availability: [], start: new Date(), end: null }
}

/**
 * Assigns a final timestamp to a request
 * @param {*} service
 */
exports.endResponse = function (request) {
  return { ...request, end: new Date() }
}

/**
 * Export a constant string to use for user agent
 */
exports.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586'