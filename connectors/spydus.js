import * as common from '../helpers/common.js'
import * as spydus from '../helpers/spydus.js'

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
    // Step 1: Request Spydus catalogue page used to populate location selector.
    const agent = spydus.createAgent(service)
    const librariesPage = await spydus.fetchLibrariesPage(agent, service)

    // Step 2: Parse location options into a plain library-name list.
    responseLibraries.libraries = spydus.parseLibraries(librariesPage.text)
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
    // Step 1: Submit Spydus ISBN search and ensure there are card results.
    const agent = spydus.createAgent(service)
    const holdingsUrl = spydus.searchUrl(service, isbn)
    const searchResultsPage = await spydus.fetchSearchResultsPage(agent, service, isbn)
    responseHoldings.url = holdingsUrl

    if (!spydus.hasSearchResults(searchResultsPage.text)) { return common.endResponse(responseHoldings) }

    // Step 2: Resolve record id and follow availability details link.
    responseHoldings.id = spydus.firstResultId(searchResultsPage.text)
    const availabilityUrl = spydus.availabilityLink(searchResultsPage.text)
    if (!availabilityUrl) return common.endResponse(responseHoldings)

    const absoluteAvailabilityUrl = spydus.absoluteAvailabilityUrl(
      service,
      availabilityUrl
    )

    // Step 3: Parse branch-level availability table from details page.
    const availabilityPage = await spydus.fetchAvailabilityPage(
      agent,
      absoluteAvailabilityUrl
    )
    responseHoldings.availability = spydus.availabilityFromTable(availabilityPage.text)
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
