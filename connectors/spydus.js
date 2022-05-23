const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('spydus connector loading...')

const SEARCH_URL = 'cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ?NRECS=1&ISBN='
const LIBS_URL = 'cgi-bin/spydus.exe/MSGTRN/WPAC/COMB'

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
  const agent = service.DisableTls ? request.agent().disableTLSCerts() : request.agent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const libsPageRequest = await agent.get(service.Url + LIBS_URL).set({ 'Cookie': 'ALLOWCOOKIES_443=1' }).timeout(60000)
    const $ = cheerio.load(libsPageRequest.text)
    $('#LOC option').each(function (idx, option) {
      if (common.isLibrary($(option).text().trim())) responseLibraries.libraries.push($(option).text().trim())
    })
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
exports.searchByISBN = async function (isbn, service) {
  const agent = service.DisableTls ? request.agent().disableTLSCerts() : request.agent()
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url + SEARCH_URL + isbn

  try {
    const itemPageRequest = await (await agent.get(responseHoldings.url).timeout(30000))
    let $ = cheerio.load(itemPageRequest.text)
    if ($('#result-content-list').length === 0) return common.endResponse(responseHoldings)

    responseHoldings.id = $('.card.card-list').first().find('a').attr('name')

    if (!responseHoldings.id) {
      responseHoldings.id = $('.card.card-list').first().find('input.form-check-input').attr('value')
    }

    const availabilityUrl = $('.card-text.availability').first().find('a').attr('href')
    const availabilityRequest = await agent.get(service.Url + availabilityUrl).timeout(30000)

    $ = cheerio.load(availabilityRequest.text)

    var libs = {}
    $('table tr').slice(1).each(function (i, tr) {
      var name = $(tr).find('td').eq(0).text().trim()
      var status = $(tr).find('td').eq(3).text().trim()
      if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
      status === 'Available' ? libs[name].available++ : libs[name].unavailable++
    })
    for (var l in libs) responseHoldings.availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })
  } catch (e) { 
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
