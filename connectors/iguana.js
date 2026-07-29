import * as common from '../helpers/common.js'
import * as iguana from '../helpers/iguana.js'
import { v4 as uuidv4 } from 'uuid'
import { agentManager } from '../helpers/agent-manager.js'

/**
 * Gets the object representing the service
 * @param {object} service
 */
export const getService = service => {
  const serviceData = common.getService(service)
  serviceData.url = iguana.serviceUrl(service)
  return serviceData
}

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
export const getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)
  const sessionId = uuidv4()

  try {
    // Step 1: Create session, initialise Iguana session and resolve SID from cookie.
    iguana.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    const sid = await iguana.getSid(sessionId, service)

    // Step 2: Submit branch-discovery search request and parse XML payload.
    const searchRequest = await iguana.postSearch(
      sessionId,
      service,
      iguana.librariesSearchBody({ service, sid })
    )
    const searchJs = await iguana.parseXml(searchRequest.text)

    // Step 3: Build branch list from either facet endpoint or shelfmark summaries.
    if (service.Faceted) {
      const resultId = searchJs.searchRetrieveResponse.resultSetId[0]
      const facetRequest = await iguana.postSearch(
        sessionId,
        service,
        iguana.facetBody({ resultId, sid })
      )
      const facetJs = await iguana.parseXml(facetRequest.text)
      responseLibraries.libraries = iguana.facetLibrariesFromSearch(
        searchJs,
        facetJs,
        service
      )
    } else {
      responseLibraries.libraries = iguana.shelfmarkLibrariesFromSearch(searchJs)
    }
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
    // Step 1: Create session, initialise Iguana session and execute ISBN search request.
    iguana.createAgent(service.Type)
    agentManager.createSessionAgent(sessionId, service.Type)
    const sid = await iguana.getSid(sessionId, service)
    const searchRequest = await iguana.postSearch(
      sessionId,
      service,
      iguana.searchBody({ service, isbn, sid })
    )

    // Step 2: Parse first result record and map identifier/availability.
    const searchJs = await iguana.parseXml(searchRequest.text)
    const record = iguana.firstResultRecord(searchJs)
    responseHoldings.id = iguana.recordId(record)
    responseHoldings.availability = iguana.availabilityFromRecord(record)
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
