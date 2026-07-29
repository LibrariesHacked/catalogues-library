import * as common from '../helpers/common.js'
import * as durham from '../helpers/durham.js'
import { v4 as uuidv4 } from 'uuid'
import { agentManager } from '../helpers/agent-manager.js'

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
  const sessionId = uuidv4()

  try {
    // Step 1: Create session and bootstrap login required by catalogue pages.
    durham.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    await durham.startSession(sessionId, service)

    // Step 2: Request and parse branch links from the libraries page.
    const librariesPage = await durham.fetchLibrariesPage(sessionId, service)
    responseLibraries.libraries = durham.librariesFromPage(librariesPage.text)
  } catch (e) {
    responseLibraries.exception = e
  } finally {
    agentManager.closeSession(sessionId)
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
  const sessionId = uuidv4()

  try {
    // Step 1: Create session, bootstrap login, and load initial keyword-search page state.
    durham.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    await durham.startSession(sessionId, service)
    const cataloguePage = await durham.openKeywordSearchPage(sessionId, service)

    // Step 2: Submit ISBN search form and verify at least one title result exists.
    const resultPage = await durham.submitKeywordSearch(
      sessionId,
      service,
      durham.librariesForm(cataloguePage.text, isbn)
    )
    if (!durham.hasResultTitle(resultPage.text)) { return common.endResponse(responseHoldings) }

    const resultPageUrl = durham.resultPageUrlFromResponse(resultPage)

    // Step 3: Open first item details page and then request libraries availability view.
    const itemPage = await durham.openFirstItemPage(
      sessionId,
      resultPageUrl,
      durham.resultForm(resultPage.text)
    )
    const itemPageUrl = durham.itemPageUrl(itemPage, resultPageUrl)

    const availabilityPage = await durham.openAvailabilityPage(
      sessionId,
      itemPageUrl,
      durham.availabilityForm(itemPage.text)
    )

    // Step 4: Parse and assign per-library availability totals.
    responseHoldings.availability = durham.availabilityFromPage(availabilityPage.text)
  } catch (e) {
    responseHoldings.exception = e
  } finally {
    agentManager.closeSession(sessionId)
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
