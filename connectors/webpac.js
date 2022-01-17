const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('webpac connector loading')

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = (service) => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const agent = request.agent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const advancedSearchPageRequest = await agent.get(service.Url + 'search/X').timeout(60000)
    const $ = cheerio.load(advancedSearchPageRequest.text)
    $('select[Name=searchscope] option').each((idx, option) => {
      if (common.isLibrary($(option).text())) responseLibraries.libraries.push($(option).text().trim())
    })
  } catch (e) {}

  return common.endResponse(responseLibraries)
}

/**
 * Retrieves the availability summary of an ISBN by library
 * @param {string} isbn
 * @param {object} service
 */
exports.searchByISBN = async function (isbn, service) {
  const agent = request.agent()
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  const libs = {}
  responseHoldings.url = service.Url + 'search~S1/?searchtype=i&searcharg=' + isbn

  try {
    const responseHoldingsRequest = await agent.get(responseHoldings.url).timeout(60000)
      // SuperAgent struggling with the certificate for https://library.south-ayrshire.gov.uk/
      // Unable to validate the leaf certificate with the latest version of Node in use. Node
      // uses its own list of root certificate authorities rather than the OS' list. Most puzzling!
      // Disabling since the connection will still be encrypted; it won't be able to confirm the
      // party with which it's communicating can be trusted, though.
      .disableTLSCerts()

    const $ = cheerio.load(responseHoldingsRequest.text)

    var id = $('#recordnum')
    responseHoldings.id = id.attr('href').replace('/record=', '')

    $('table.bibItems tr.bibItemsEntry').each(function (idx, tr) {
      var name = $(tr).find('td').eq(0).text().trim()
      var status = $(tr).find('td').eq(3).text().trim()
      if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
      status === 'AVAILABLE' || status === 'FOR LOAN' ? libs[name].available++ : libs[name].unavailable++
    })
  } 
  catch (e) {}

  for (var l in libs) responseHoldings.availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })

  return common.endResponse(responseHoldings)
}
