const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('enterprise connector loading...')

const SEARCH_URL = 'search/results?qu='
const ITEM_URL = 'search/detailnonmodal/ent:[ILS]/one'
const HEADER = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586' }
const HEADER_POST = { 'X-Requested-With': 'XMLHttpRequest' }

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
    const advancedPage = await agent.get(service.Url + 'search/advanced').timeout(30000)
    $ = cheerio.load(advancedPage.text)
  } catch (e) {
    responseLibraries.exception = e
    return common.endResponse(responseLibraries)
  }

  $('#libraryDropDown option').each((idx, lib) => {
    const name = $(lib).text().trim()
    if (common.isLibrary(name) && ((service.LibraryNameFilter && name.indexOf(service.LibraryNameFilter) !== -1) || !service.LibraryNameFilter)) responseLibraries.libraries.push(name)
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
  responseHoldings.url = service.Url + SEARCH_URL + isbn
  let itemPage = ''
  let availabilityJson = null

  let itemId = null
  let $ = null
  let deepLinkPageUrl = null
  try {
    // We could also use RSS https://wales.ent.sirsidynix.net.uk/client/rss/hitlist/ynysmon_en/qu=9780747538493
    const deepLinkPageRequest = await agent.get(responseHoldings.url).set(HEADER).timeout(30000)

    if (deepLinkPageRequest.redirects.length > 0) {
      let url = deepLinkPageRequest.redirects.find(x => x.indexOf('ent:') > 0)
      if (url) {
        deepLinkPageUrl = url;
      }
      else {
        deepLinkPageUrl = responseHoldings.url;
      }
    }
    else {
      deepLinkPageUrl = responseHoldings.url;
    }

    if (deepLinkPageUrl.indexOf('ent:') > 0) {
      itemId = deepLinkPageUrl.substring(deepLinkPageUrl.lastIndexOf('ent:') + 4, deepLinkPageUrl.lastIndexOf('/one')) || ''
      responseHoldings.id = itemId
    }

    $ = cheerio.load(deepLinkPageRequest.text)
    itemPage = deepLinkPageRequest.text

    if (deepLinkPageUrl.lastIndexOf('ent:') === -1) {
      // In this situation we're probably still on the search page (there may be duplicate results).
      let items = $('input.results_chkbox.DISCOVERY_ALL')
  
      for (let item of items) {
        itemId = item.attribs.value;
        itemId = itemId.substring(itemId.lastIndexOf('ent:') + 4)
        itemId = itemId.split('/').join('$002f')
        responseHoldings.id = itemId
  
        if (itemId === '') return common.endResponse(responseHoldings)
  
        const itemPageUrl = service.Url + ITEM_URL.replace('[ILS]', itemId)
        const itemPageRequest = await agent.get(itemPageUrl).timeout(30000)
        itemPage = itemPageRequest.text
  
        responseHoldings.availability = await processItemPage(agent, itemId, itemPage, service)
  
        if (responseHoldings.availability.length > 0)
          break;
      }
    }
    else {
      responseHoldings.availability = await processItemPage(agent, itemId, itemPage, service)
    }
  } 
  catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}

const processItemPage = async (agent, itemId, itemPage, service) => {
  let availabilityJson = null
  const availability = [];

  // Get CSRF token, if available
  let csrfMatches = /__sdcsrf\s+=\s+"([a-f0-9\-]+)"/gm.exec(itemPage);
  let csrf = null;
  if (csrfMatches && csrfMatches[1])
    csrf = csrfMatches[1];

  let $ = cheerio.load(itemPage)

  // Availability information may already be part of the page.
  let matches = /parseDetailAvailabilityJSON\(([\s\S]*?)\)/.exec(itemPage)
  if (matches && matches[1] && common.isJsonString(matches[1])) {
    availabilityJson = JSON.parse(matches[1])
  }

  if (availabilityJson === null && service.AvailabilityUrl) {
    // e.g. /search/detailnonmodal.detail.detailavailabilityaccordions:lookuptitleinfo/ent:$002f$002fSD_ILS$002f0$002fSD_ILS:548433/ILS/0/true/true?qu=9780747538493&d=ent%3A%2F%2FSD_ILS%2F0%2FSD_ILS%3A548433%7E%7E0&ps=300
    const availabilityUrl = service.Url + service.AvailabilityUrl.replace('[ITEMID]', itemId.split('/').join('$002f'))

    const availabilityPageRequest = await agent.post(availabilityUrl)
                                      .set(HEADER_POST)
                                      .set({'sdcsrf': csrf})
                                      .timeout(30000)
    const availabilityResponse = availabilityPageRequest.body
    if (availabilityResponse.ids || availabilityResponse.childRecords) availabilityJson = availabilityResponse
  }

  if (availabilityJson?.childRecords) {
    const libs = {}
    $(availabilityJson.childRecords).each(function (i, c) {
      const name = c.LIBRARY
      const status = c.SD_ITEM_STATUS
      if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
      service.Available.indexOf(status) > 0 ? libs[name].available++ : libs[name].unavailable++
    })
    for (var lib in libs) availability.push({ library: lib, available: libs[lib].available, unavailable: libs[lib].unavailable })
    return availability
  }

  if (availabilityJson?.ids) {
    $ = cheerio.load(itemPage)
    var libs = {}
    $('.detailItemsTableRow').each(function (index, elem) {
      var name = $(this).find('td').eq(0).text().trim()
      var bc = $(this).find('td div').attr('id').replace('availabilityDiv', '')
      if (bc && availabilityJson.ids && availabilityJson.ids.length > 0 && availabilityJson.strings && availabilityJson.ids.indexOf(bc) !== -1) {
        var status = availabilityJson.strings[availabilityJson.ids.indexOf(bc)].trim()
        if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
        service.Available.indexOf(status) > 0 ? libs[name].available++ : libs[name].unavailable++
      }
    })
    for (var l in libs) availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })
    return availability
  }

  if (service.TitleDetailUrl) {
    var titleUrl = service.Url + service.TitleDetailUrl.replace('[ITEMID]', itemId.split('/').join('$002f'))

    const titleDetailRequest = await agent.post(titleUrl).set(HEADER_POST).timeout(30000)
    const titles = titleDetailRequest.body
    const libs = {}
    $(titles.childRecords).each(function (i, c) {
      const name = c.LIBRARY
      const status = c.SD_ITEM_STATUS
      if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
      service.Available.indexOf(status) > 0 ? libs[name].available++ : libs[name].unavailable++
    })
    for (var lib in libs) availability.push({ library: lib, available: libs[lib].available, unavailable: libs[lib].unavailable })
    return availability
  }
}