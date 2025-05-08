// HTML:
//  <link rel="stylesheet" type="text/css" href="/interface/themes/responsive/css/main.css?v=22.01.10.17">

const cheerio = require('cheerio')
const request = require('superagent')

const common = require('./common')

const CAT_URL =
  'Search/Results?lookfor=[ISBN]&searchIndex=Keyword&sort=relevance&view=rss&searchSource=local'
const LIBS_URL =
  'Union/Search?view=list&showCovers=on&lookfor=&searchIndex=advanced&searchSource=local'

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = service => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()
    const url = service.Url + LIBS_URL

    const libraryPageRequest = await agent.get(url).timeout(60000)
    const $ = cheerio.load(libraryPageRequest.text)

    $('option').each((idx, option) => {
      if (
        (option.attribs.value.startsWith('owning_location_main:') ||
          option.attribs.value.startsWith('owning_location:')) &&
        common.isLibrary($(option).text().trim())
      ) {
        responseLibraries.libraries.push($(option).text().trim())
      }
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
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url

  try {
    const agent = request.agent()

    const searchUrl = service.Url + CAT_URL.replace('[ISBN]', isbn)
    const searchPageRequest = await agent.get(searchUrl).timeout(30000)
    let $ = cheerio.load(searchPageRequest.text, {
      normalizeWhitespace: true,
      xmlMode: true
    })
    responseHoldings.url = $('item > link').first().text()

    let bibLink = $('guid').text()
    if (!bibLink) return common.endResponse(responseHoldings)

    responseHoldings.id = bibLink.substring(bibLink.lastIndexOf('/') + 1)
    bibLink = `${bibLink}/AJAX?method=getCopyDetails&format=Reference&recordId=${responseHoldings.id}`

    const itemPageRequest = await agent.get(bibLink).timeout(30000)
    $ = cheerio.load(itemPageRequest.body.modalBody)

    const libs = {}

    $('table')
      .find('tbody > tr')
      .each((idx, row) => {
        const lib = $(row).find('td.notranslate').first().text().trim()
        if (!libs[lib]) libs[lib] = { available: 0, unavailable: 0 }
        const quantity = $(row).find('td').first().text().trim().split(' of ')
        libs[lib].available += parseInt(quantity[0])
        libs[lib].unavailable += parseInt(quantity[1]) - parseInt(quantity[0])
      })

    for (const l in libs)
      responseHoldings.availability.push({
        library: l,
        available: libs[l].available,
        unavailable: libs[l].unavailable
      })
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
