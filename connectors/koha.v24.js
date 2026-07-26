import * as common from '../helpers/common.js'
import * as koha from '../helpers/koha.js'

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
    // Step 1: Request Koha v24 advanced-search page with branch filter values.
    const agent = koha.createAgent()
    const librariesPage = await koha.fetchLibrariesPage(agent, service)

    // Step 2: Parse branch options and facet labels into library list.
    responseLibraries.libraries = koha.librariesFromPage(librariesPage.text)
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
  responseHoldings.url = service.Url

  try {
    // Step 1: Query Koha v24 RSS search feed by ISBN and resolve first bib link.
    const agent = koha.createAgent()
    const searchFeed = await koha.fetchSearchFeed(agent, service, isbn)
    const firstResult = koha.firstBibLink(searchFeed.text)
    responseHoldings.url = firstResult.deepLink

    if (!firstResult.bibLink) return common.endResponse(responseHoldings)

    responseHoldings.id = koha.bibIdFromLink(firstResult.bibLink)
    responseHoldings.url = firstResult.bibLink

    // Step 2: Request full items table and aggregate availability by branch.
    const bibItemsPage = await koha.fetchBibItemsPage(agent, firstResult.bibLink)
    responseHoldings.availability = koha.availabilityFromBibItemsPage(bibItemsPage.text)
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
