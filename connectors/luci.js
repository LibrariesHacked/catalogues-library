import * as common from '../helpers/common.js'
import * as luci from '../helpers/luci.js'

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
    // Step 1: Request Luci home page and resolve current front-end build identifier.
    const agent = luci.createAgent()
    const homePage = await luci.fetchHomePage(agent, service)
    const frontEndId = luci.frontEndIdFromHome(homePage.text)

    // Step 2: Load registration payload and map patron home-location options.
    const registrationData = await luci.fetchRegistrationData(agent, service, frontEndId)
    const locations = luci.librariesFromRegistrationData(registrationData.body)
    responseLibraries.libraries = locations.map(x => x.name)
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
    // Step 1: Resolve Luci app identifier from home page.
    const agent = luci.createAgent()
    const homePage = await luci.fetchHomePage(agent, service)
    const appId = luci.appIdFromHome(homePage.text)

    // Step 2: Search manifestations by ISBN and pick the matching physical record.
    const manifestations = await luci.searchManifestations(agent, service, appId, isbn)
    const result = luci.findManifestationByIsbn(manifestations.body.records, isbn)
    if (!result || result.eContent) return common.endResponse(responseHoldings)

    responseHoldings.id = result.recordID
    responseHoldings.url = `${service.Url}manifestations/${result.recordID}`

    // Step 3: Load record copy details and aggregate availability per library.
    const recordDetails = await luci.fetchRecordDetails(
      agent,
      service,
      appId,
      result.recordID
    )
    responseHoldings.availability = luci.availabilityFromCopies(
      recordDetails.body.data.copies
    )
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
