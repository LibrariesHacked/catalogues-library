// HTML:
//  <meta name="generator" content="Koha 20.1113000">

const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../common')

console.log('koha connector loading...')

const CAT_URL = 'cgi-bin/koha/opac-search.pl?format=rss2&idx=nb&q='
const LIBS_URL = 'cgi-bin/koha/opac-search.pl?[MULTIBRANCH]do=Search&expand=holdingbranch#holdingbranch_id'

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
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()
    const url = service.Url + (LIBS_URL.replace('[MULTIBRANCH]', service.MultiBranchLimit ? 'multibranchlimit=' + service.MultiBranchLimit + '&' : ''))
  
    const libraryPageRequest = await agent.get(url).timeout(60000)
    let $ = cheerio.load(libraryPageRequest.text)
  
    $('#branchloop option').each((idx, option) => {
      if (common.isLibrary($(option).text())) responseLibraries.libraries.push($(option).text().trim())
    })
    $('li#holdingbranch_id ul li span.facet-label').each((idx, label) => {
      responseLibraries.libraries.push($(label).text().trim())
    })
    $('li#homebranch_id ul li span.facet-label').each((idx, label) => {
      responseLibraries.libraries.push($(label).text().trim())
    })
  }
  catch(e) {
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

    const searchPageRequest = await agent.get(service.Url + CAT_URL + isbn).timeout(30000)
    let $ = cheerio.load(searchPageRequest.text, { normalizeWhitespace: true, xmlMode: true })
    responseHoldings.url = $('link').first().text()
  
    var bibLink = $('guid').text()
    if (!bibLink) return common.endResponse(responseHoldings)
  
    responseHoldings.id = bibLink.substring(bibLink.lastIndexOf('=') + 1);
    responseHoldings.url = bibLink
  
    const itemPageRequest = await agent.get(bibLink + '&viewallitems=1').timeout(30000)
    $ = cheerio.load(itemPageRequest.text)
  
    const libs = {}
    $('#holdingst tbody, .holdingst tbody').find('tr').each((idx, table) => {
      var lib = $(table).find('td.location span span').first().text().trim()
      if (!libs[lib]) libs[lib] = { available: 0, unavailable: 0 }
      $(table).find('td.status span').text().trim() === 'Available' ? libs[lib].available++ : libs[lib].unavailable++
    })
    for (var l in libs) responseHoldings.availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })
  }
  catch(e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
