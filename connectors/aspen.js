import * as common from '../helpers/common.js'
import * as aspen from '../helpers/aspen.js'
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
    // Step 1: Create session and request Aspen advanced-search page that contains location options.
    aspen.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    const advancedSearchPage = await aspen.fetchAdvancedSearchPage(sessionId, service)

    // Step 2: Parse library names from the advanced-search option values.
    responseLibraries.libraries = aspen.librariesFromAdvancedSearchPage(advancedSearchPage.text)
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
  const sessionId = uuidv4()

  try {
    // Step 1: Create session and submit Aspen keyword search scoped by the ISBN.
    aspen.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    const searchResultsPage = await aspen.fetchSearchResultsPage(sessionId, service, isbn)

    // Step 2: Resolve the first grouped-work identifier from the search results.
    const firstItem = aspen.firstItemFromSearchResults(searchResultsPage.text, service)
    if (!firstItem) return common.endResponse(responseHoldings)

    responseHoldings.id = firstItem.id
    responseHoldings.url = firstItem.url

    // Step 3: Request copy-details payload and map per-branch availability.
    const copiesPage = await aspen.fetchCopiesPage(sessionId, service, firstItem.id)
    responseHoldings.availability = aspen.availabilityFromCopiesPage(copiesPage.text)
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
