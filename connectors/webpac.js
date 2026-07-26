import * as common from '../helpers/common.js'
import * as webpac from '../helpers/webpac.js'

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
    // Step 1: Request WebPAC advanced search page containing scope options.
    const agent = webpac.createAgent()
    const librariesPage = await webpac.fetchLibrariesPage(agent, service)

    // Step 2: Parse search-scope options into library names.
    responseLibraries.libraries = webpac.librariesFromPage(librariesPage.text)
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
  responseHoldings.url = webpac.holdingsSearchUrl(service, isbn)

  try {
    // Step 1: Execute WebPAC ISBN search request and parse first bib record.
    const agent = webpac.createAgent()
    const holdingsPage = await webpac.fetchHoldingsSearchPage(agent, service, isbn)

    responseHoldings.id = webpac.getItemId(holdingsPage.text)

    // Step 2: Aggregate bibItems table statuses by library.
    responseHoldings.availability = webpac.getLibrariesAvailability(holdingsPage.text)
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
