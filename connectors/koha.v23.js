const cheerio = require('cheerio')
const request = require('superagent')

const initCycleTLS = require('cycletls')

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
    const url = service.Url + (service.LibsUrl || LIBS_URL)

    let libraryPage = null
    if (service.Cloudflare) {
      const cycleTLS = await initCycleTLS()
      libraryPage = await cycleTLS(
        url,
        {
          ja3: '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53-10,0-23-65281-10-11-35-16-5-51-43-13-45-28-21,29-23-24-25-256-257,0',
          userAgent: 'LibraryCatalogues'
        },
        'get'
      ).body
    } else {
      libraryPage = (await agent.get(url).timeout(30000)).text
    }

    const $ = cheerio.load(libraryPage)

    $('option').each((idx, option) => {
      if (
        (option.attribs.value.startsWith('owning_location:') ||
          option.attribs.value.startsWith('branch:')) &&
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

    let searchUrl = service.Url + (service.CatUrl || CAT_URL)
    searchUrl = searchUrl.replace('[ISBN]', isbn)
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
