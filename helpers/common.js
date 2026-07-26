/**
 * The majority of the get service call is just returning information that's in the service
 * object from data.json.  Maintain a list here of what to return.
 * @param {object} service
 */
export function getService (service) {
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
export function handleErrors (error, httpMessage) {
  if (httpMessage && (httpMessage.statusCode !== 200 && httpMessage.statusCode !== 302)) error = 'Web request error. Status code was ' + httpMessage.statusCode
  if (error) return true
  return false
}

/**
 * Test if a string is json
 * @param {string} str
 */
export function isJsonString (str) {
  try {
    JSON.parse(str)
  } catch (e) { return false }
  return true
}

/**
 * Test if a string is a library
 * @param {string} str
 */
export function isLibrary (str) {
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
export function initialiseGetLibrariesResponse (service) {
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
export function initialiseSearchByISBNResponse (service) {
  return { id: null, service: service.Name, code: service.Code, availability: [], start: new Date(), end: null }
}

/**
 * Creates a new object to store current loan results
 * @param {object} service
 */
export function initialiseGetCurrentLoansResponse (service) {
  return {
    service: service.Name,
    code: service.Code,
    loans: [],
    supported: false,
    start: new Date(),
    end: null
  }
}

/**
 * Default current loans implementation for connectors that do not yet support borrower authentication
 * @param {object} service
 */
export function unsupportedGetCurrentLoans (service) {
  const responseLoans = initialiseGetCurrentLoansResponse(service)
  responseLoans.message = 'Current loans are not implemented for this catalogue integration.'
  return endResponse(responseLoans)
}

/**
 * Assigns a final timestamp to a request
 * @param {*} service
 */
export function endResponse (request) {
  return { ...request, end: new Date() }
}

/**
 * Normalises cookies so they can be reused on follow-up requests.
 * @param {Array<string>} sessionCookies
 * @param {string} botCookie
 */
export function cleanCookies (sessionCookies, botCookie) {
  const cookies = [...sessionCookies]
  if (botCookie) cookies.push(botCookie + ';')

  for (let i = 0; i < cookies.length; i++) {
    cookies[i] = cookies[i]
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*HttpOnly/gi, '')
      .replace(/;\s*SameSite=Lax/gi, '')
      .replace(/;\s*SameSite=Strict/gi, '')
  }

  return cookies.join('; ')
}

/**
 * Creates or updates a per-library availability summary.
 * @param {object} libs
 * @param {string} libraryName
 * @param {boolean} isAvailable
 */
export function tallyLibraryAvailability (libs, libraryName, isAvailable) {
  if (!libs[libraryName]) libs[libraryName] = { available: 0, unavailable: 0 }
  if (isAvailable) libs[libraryName].available++
  else libs[libraryName].unavailable++
}
