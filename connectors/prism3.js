const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('prism3 connector loading...')

const AVAILABLE_STATUSES = ['http://schema.org/InStock', 'http://schema.org/InStoreOnly'];
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
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()

    const advancedSearchPageRequest = await agent.get(service.Url + 'advancedsearch?target=catalogue').timeout(60000)
    const $ = cheerio.load(advancedSearchPageRequest.text)
  
    $('#locdd option').each((idx, option) => {
      if (common.isLibrary($(option).text())) responseLibraries.libraries.push($(option).text().trim())
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
  responseHoldings.url = service.Url + DEEP_LINK + isbn

  try {
    const agent = request.agent()

    let $ = null
    const searchRequest = await agent.get(service.Url + 'items.json?query=' + isbn).set(HEADER).timeout(30000)
    if (searchRequest.body.length === 0) return common.endResponse(responseHoldings)

    let itemUrl = ''

    for (let k of Object.keys(searchRequest.body)) {
      let eBook = true

      if (k.indexOf('/items/') > 0) {
        itemUrl = k;

        for(let key of Object.keys(searchRequest.body[k])) {
          let item = searchRequest.body[k][key]

          switch (key) {
            case 'http://purl.org/dc/elements/1.1/format':
              item.forEach(format => {
                // One record can contain multiple formats. If *any* aren't
                // an eBook, we should get the item details.
                if (format.value !== 'eBook')
                  eBook = false;
              })
              break;
            case 'http://purl.org/dc/terms/identifier':
              responseHoldings.id = item[0].value; 
              break;
          }
        }

        if (itemUrl && eBook) {
          itemUrl = ''
          // Try the next record, just in case..
        }
        else {
          // We've found what we needed - leave the "for" loop.
          break;
        }
      }
    }

    if (itemUrl !== '') {
      const itemRequest = await agent.get(itemUrl).timeout()
      $ = cheerio.load(itemRequest.text)
    } else {
      return common.endResponse(responseHoldings)
    }
  
    $('#availability ul.options').find('li').each((idx, li) => {
      var libr = { library: $(li).find('h3 span span').text().trim(), available: 0, unavailable: 0 }
      $(li).find('div.jsHidden table tbody tr').each((i, tr) => {
        const status = $(tr).find("link[itemprop = 'availability']").attr('href')
        AVAILABLE_STATUSES.includes(status) ? libr.available++ : libr.unavailable++
      })
      responseHoldings.availability.push(libr)
    })
  }
  catch(e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
