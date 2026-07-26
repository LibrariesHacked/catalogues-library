import * as common from '../helpers/common.js'
import * as enterprise from '../helpers/enterprise.js'

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
    // Step 1: Read Enterprise advanced-search branch filters.
    const enterpriseLibraryFilters = await enterprise.getLibraries(service)

    // Step 2: Normalise Enterprise filters into shared library output.
    responseLibraries.libraries = enterpriseLibraryFilters.libraries || []
    if (enterpriseLibraryFilters.exception) { responseLibraries.exception = enterpriseLibraryFilters.exception }
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
    // Step 1: Resolve Enterprise item and per-branch availability.
    const enterpriseItemAvailability = await enterprise.searchByISBN(isbn, service)

    // Step 2: Map Enterprise item response into standard holdings schema.
    responseHoldings.id = enterpriseItemAvailability.id
    responseHoldings.url = enterpriseItemAvailability.url
    responseHoldings.availability = enterpriseItemAvailability.availability || []
    if (enterpriseItemAvailability.exception) { responseHoldings.exception = enterpriseItemAvailability.exception }
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
