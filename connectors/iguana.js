import * as common from '../helpers/common.js'
import * as iguana from '../helpers/iguana.js'

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

  try {
    // Step 1: Initialise Iguana session and resolve SID from cookie.
    const agent = iguana.createAgent()
    const sid = await iguana.getSid(service)

    // Step 2: Submit branch-discovery search request and parse XML payload.
    const searchRequest = await iguana.postSearch(
      agent,
      service,
      iguana.librariesSearchBody({ service, sid })
    )
    const searchJs = await iguana.parseXml(searchRequest.text)

    // Step 3: Build branch list from either facet endpoint or shelfmark summaries.
    if (service.Faceted) {
      const resultId = searchJs.searchRetrieveResponse.resultSetId[0]
      const facetRequest = await iguana.postSearch(
        agent,
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
    // Step 1: Initialise Iguana session and execute ISBN search request.
    const agent = iguana.createAgent()
    const sid = await iguana.getSid(service)
    const searchRequest = await iguana.postSearch(
      agent,
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
