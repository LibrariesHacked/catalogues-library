import * as common from '../helpers/common.js'
import * as arena from '../helpers/arena.js'

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
    // Step 1: Optional signup page request for branch options.
    if (service.SignupUrl) {
      const signupResponse = await arena.getSignupResponse(service)
      const signupLibraries = arena.signupLibraries(signupResponse.text)
      if (signupLibraries.length > 0) {
        responseLibraries.libraries = signupLibraries
        return common.endResponse(responseLibraries)
      }
    }

    // Step 2: Advanced search page request for directly-rendered branch options.
    const advancedSearchResponse = await arena.getAdvancedSearchResponse(service)
    const advancedLibraries = arena.advancedSearchLibraries(advancedSearchResponse.text)
    if (advancedLibraries.length > 0) {
      responseLibraries.libraries = advancedLibraries
      return common.endResponse(responseLibraries)
    }

    // Step 3: Extended-search portlet POST to fetch branch options via Ajax component payload.
    const focusedElementId = arena.extendedSearchFocusedElementId(advancedSearchResponse.text)
    const portletRes = await arena.postExtendedSearchPortlet(service, focusedElementId)
    const portletHtml = await arena.responseComponentHtml(portletRes.text)

    if (portletHtml) responseLibraries.libraries.push(...arena.extendedSearchLibraries(portletHtml))
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
    // Step 1: Search request (with anti-bot retry flow) to resolve the Arena record.
    const query = arena.buildSearchQuery(service, isbn)
    responseHoldings.url = arena.searchUrl(service, query)
    const cookieResponse = await arena.getSearchResponseWithCookies(service, query)
    const searchResponse = cookieResponse.response
    const cookies = common.cleanCookies(searchResponse.headers['set-cookie'], cookieResponse.cookieString)

    // Step 2: Parse record identifier from search response.
    const itemId = arena.itemIdFromSearchResponse(searchResponse.text)
    if (!itemId) return common.endResponse(responseHoldings)

    responseHoldings.id = itemId

    // Step 3: Item detail request for first-pass branch availability.
    const itemPageResponse = await arena.getItemResponse(service, itemId, cookies)

    const branchAvailability = arena.branchAvailability(itemPageResponse.text)
    if (branchAvailability.length > 0) {
      responseHoldings.availability = branchAvailability
      return common.endResponse(responseHoldings)
    }

    // Step 4: Holdings panel POST request for record-level availability fragments.
    const holdingsUrl = arena.holdingsUrl(service)
    const holdingsRes = await arena.getHoldingsResponse(service, cookies)
    const holdingsHtml = await arena.responseComponentHtml(holdingsRes.text)
    if (!holdingsHtml) return common.endResponse(responseHoldings)

    const recordAvailability = arena.recordAvailabilities(holdingsHtml)
    if (recordAvailability.length > 0) {
      responseHoldings.availability = recordAvailability
      return common.endResponse(responseHoldings)
    }

    // Step 5: Determine the current branch/organisation context for deep holdings requests.
    const currentHolding = arena.currentHoldingLink(holdingsHtml, service.OrganisationName || service.Name)
    if (!currentHolding) return common.endResponse(responseHoldings)

    // Step 6: Record-panel POST request to load child holdings containers.
    const interfaceId = arena.holdingsInterfaceId(currentHolding.holdingsLink)
    const recordRes = await arena.postRecordResponse({
      service,
      holdingsUrl,
      cookies,
      focusedElementId: currentHolding.linkId,
      interfaceId,
      currentOrg: currentHolding.currentOrg
    })
    const recordHtml = await arena.responseComponentHtml(recordRes.text)
    if (!recordHtml) return common.endResponse(responseHoldings)

    // Step 7: Build one POST request per child holdings container.
    const availabilityRequests = []
    const childContainerRows = arena.childContainerRows(recordHtml)

    for (let i = 0; i < childContainerRows.length; i += 1) {
      const containerHtml = childContainerRows[i]
      const linkId = arena.childContainerLinkId(containerHtml)
      if (!linkId) continue

      const childRequest = arena.postChildResponse({
        service,
        holdingsUrl,
        cookies,
        focusedElementId: linkId,
        interfaceId,
        currentOrg: currentHolding.currentOrg,
        idx: i
      })
      availabilityRequests.push(childRequest)
    }

    // Step 8: Resolve all child holdings requests and merge branch availability.
    const responses = await Promise.all(availabilityRequests)
    for (const response of responses) {
      const availability = await arena.childResponseAvailability(response.text)
      if (availability) responseHoldings.availability.push(availability)
    }
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
