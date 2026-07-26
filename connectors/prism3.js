import * as common from '../helpers/common.js'
import * as prism3 from '../helpers/prism3.js'

/**
 * Gets the object representing the service
 * @param {object} service
 */
export const getService = service => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
export const getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    // Step 1: Inspect Prism3 advanced-search location selector.
    const prismLocationOptions = await prism3.getLibraries(service)

    // Step 2: Normalise Prism3 locations into shared library output.
    responseLibraries.libraries = prismLocationOptions.libraries || []
    if (prismLocationOptions.exception) { responseLibraries.exception = prismLocationOptions.exception }
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

/**
 * Retrieves the availability summary of an ISBN by library
 * @param {string} isbn
 * @param {object} service
 */
export const searchByISBN = async function (isbn, service) {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    // Step 1: Run Prism3 item search and branch tally workflow.
    const prismItemAvailability = await prism3.searchByISBN(isbn, service)

    // Step 2: Map Prism3 availability into common holdings response fields.
    responseHoldings.id = prismItemAvailability.id
    responseHoldings.url = prismItemAvailability.url
    responseHoldings.availability = prismItemAvailability.availability || []
    if (prismItemAvailability.exception) { responseHoldings.exception = prismItemAvailability.exception }
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}

/**
 * Retrieves the current loans for a borrower
 * @param {string} userId
 * @param {string} password
 * @param {object} service
 */
export const getCurrentLoans = async function (userId, password, service) {
  return common.unsupportedGetCurrentLoans(service)
}
