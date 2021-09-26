const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('prism3 connector loading...')

const HEADER = { 'Content-Type': 'text/xml; charset=utf-8' }
const DEEP_LINK = 'items?query='

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

  let $ = null
  try {
    const advancedSearchPageRequest = await agent.get(service.Url + 'advancedsearch?target=catalogue').timeout(60000)
    $ = cheerio.load(advancedSearchPageRequest.text)
  } catch (e) {
    return common.endResponse(responseLibraries)
  }

  $('#locdd option').each((idx, option) => {
    if ($(option).text() !== '') responseLibraries.libraries.push($(option).text())
  })

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
  responseHoldings.url = service.Url + DEEP_LINK + isbn

  let $ = null
  try {
    const searchRequest = await agent.get(service.Url + 'items.json?query=' + isbn).set(HEADER).timeout(30000)
    if (searchRequest.body.length === 0) return common.endResponse(responseHoldings)

    let itemUrl = ''
    Object.keys(searchRequest.body).forEach(key => {
      const keyData = searchRequest.body[key]
      if (searchRequest.body[key]['http://purl.org/dc/elements/1.1/format']) {
        let eBook = false
        searchRequest.body[key]['http://purl.org/dc/elements/1.1/format'].forEach(format => {
          if (format.value === 'eBook') eBook = true
        })
        if (!eBook) itemUrl = key
      }
    })

    if (itemUrl !== '') {
      const itemRequest = await agent.get(itemUrl).set(HEADER).timeout()
      $ = cheerio.load(itemRequest.text)
    } else {
      return common.endResponse(responseHoldings)
    }
  } catch (e) {
    return common.endResponse(responseHoldings)
  }

  $('#availability').find('ul.options li').each((idx, li) => {
    var libr = { library: $(li).find('h3 span span').text().trim(), available: 0, unavailable: 0 }
    $(li).find('div.jsHidden table tbody tr').each((i, tr) => {
      ($(tr).find("link[itemprop = 'availability']").attr('href') == 'http://schema.org/InStock') ? libr.available++ : libr.unavailable++
    })
    responseHoldings.availability.push(libr)
  })

  return common.endResponse(responseHoldings)
}
