import * as common from '../helpers/common.js'
import * as durham from '../helpers/durham.js'

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
    // Step 1: Start ASP.NET session and login bootstrap required by catalogue pages.
    const agent = durham.createAgent()
    await durham.startSession(agent, service)

    // Step 2: Request and parse branch links from the libraries page.
    const librariesPage = await durham.fetchLibrariesPage(agent, service)
    responseLibraries.libraries = durham.librariesFromPage(librariesPage.text)
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
  responseHoldings.id = durham.randomRequestId()

  try {
    // Step 1: Bootstrap session and load initial keyword-search page state.
    const agent = durham.createAgent()
    await durham.startSession(agent, service)
    const cataloguePage = await durham.openKeywordSearchPage(agent, service)

    // Step 2: Submit ISBN search form and verify at least one title result exists.
    const resultPage = await durham.submitKeywordSearch(
      agent,
      service,
      durham.librariesForm(cataloguePage.text, isbn)
    )
    if (!durham.hasResultTitle(resultPage.text)) { return common.endResponse(responseHoldings) }

    const resultPageUrl = durham.resultPageUrlFromResponse(resultPage)

    // Step 3: Open first item details page and then request libraries availability view.
    const itemPage = await durham.openFirstItemPage(
      agent,
      resultPageUrl,
      durham.resultForm(resultPage.text)
    )
    const detailsPageUrl = durham.itemPageUrl(itemPage, resultPageUrl)

    const availabilityPage = await durham.openAvailabilityPage(
      agent,
      detailsPageUrl,
      durham.availabilityForm(itemPage.text)
    )

    // Step 4: Parse and assign per-library availability totals.
    responseHoldings.availability = durham.availabilityFromPage(availabilityPage.text)
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
