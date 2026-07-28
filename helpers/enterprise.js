import * as cheerio from 'cheerio'
import UserAgent from 'user-agents'

import * as common from './common.js'
import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { TIMEOUTS } from './config.js'

export const ITEM_URL = 'search/detailnonmodal/ent:[ILS]/one'
export const SEARCH_URL = 'search/results?qu='
export const HEADER_POST = { 'X-Requested-With': 'XMLHttpRequest' }

const SERVICE_TYPE = 'enterprise'

export const getLibraries = async service => {
  if (RATE_LIMITS[SERVICE_TYPE]) {
    agentManager.configureRateLimit(SERVICE_TYPE, RATE_LIMITS[SERVICE_TYPE])
  }
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const result = await agentManager.executeRequest(SERVICE_TYPE, async (agent, userAgent) => {
      const advancedPage = await agent
        .get(service.Url + 'search/advanced')
        .set('User-Agent', userAgent)
        .timeout(TIMEOUTS.LONG)
      return advancedPage.text
    })

    const $ = cheerio.load(result)
    $('#libraryDropDown option').each((idx, lib) => {
      const name = $(lib).text().trim()
      if (
        common.isLibrary(name) &&
        ((service.LibraryNameFilter &&
          name.indexOf(service.LibraryNameFilter) !== -1) ||
          !service.LibraryNameFilter)
      ) {
        responseLibraries.libraries.push(name)
      }
    })
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const agent = request.agent()
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url + SEARCH_URL + isbn
  let itemPage = ''

  let itemId = null
  let $ = null
  let deepLinkPageUrl = null
  try {
    const deepLinkPageRequest = await agent
      .get(responseHoldings.url)
      .set(HEADER)
      .timeout(TIMEOUTS.LONG)

    if (deepLinkPageRequest.redirects.length > 0) {
      const url = deepLinkPageRequest.redirects.find(x => x.indexOf('ent:') > 0)
      if (url) {
        deepLinkPageUrl = url
      } else {
        deepLinkPageUrl = responseHoldings.url
      }
    } else {
      deepLinkPageUrl = responseHoldings.url
    }

    if (deepLinkPageUrl.indexOf('ent:') > 0) {
      itemId =
        deepLinkPageUrl.substring(
          deepLinkPageUrl.lastIndexOf('ent:') + 4,
          deepLinkPageUrl.lastIndexOf('/one')
        ) || ''
      responseHoldings.id = itemId
    }

    $ = cheerio.load(deepLinkPageRequest.text)
    itemPage = deepLinkPageRequest.text

    if (deepLinkPageUrl.lastIndexOf('ent:') === -1) {
      const items = $('input.results_chkbox.DISCOVERY_ALL')

      for (const item of items) {
        itemId = item.attribs.value
        itemId = itemId.substring(itemId.lastIndexOf('ent:') + 4)
        itemId = itemId.split('/').join('$002f')
        responseHoldings.id = itemId

        if (itemId === '') return common.endResponse(responseHoldings)

        const itemPageUrl = service.Url + ITEM_URL.replace('[ILS]', itemId)
        const itemPageRequest = await agent
          .get(itemPageUrl)
          .timeout(TIMEOUTS.LONG)
        itemPage = itemPageRequest.text

        responseHoldings.availability = await processItemPage(
          agent,
          itemId,
          itemPage,
          service
        )

        if (responseHoldings.availability.length > 0) {
          break
        }
      }
    } else {
      responseHoldings.availability = await processItemPage(
        agent,
        itemId,
        itemPage,
        service
      )
    }
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}

export const processItemPage = async (agent, itemId, itemPage, service) => {
  let availabilityJson = null
  const availability = []

  const csrfMatches = /__sdcsrf\s+="([a-f0-9-]+)"/gm.exec(itemPage)
  let csrf = null
  if (csrfMatches && csrfMatches[1]) {
    csrf = csrfMatches[1]
  }

  let $ = cheerio.load(itemPage)

  const matches = /parseDetailAvailabilityJSON\(([\s\S]*?)\)/.exec(itemPage)
  if (matches && matches[1] && common.isJsonString(matches[1])) {
    availabilityJson = JSON.parse(matches[1])
  }

  if (availabilityJson === null && service.AvailabilityUrl) {
    const availabilityUrl =
      service.Url +
      service.AvailabilityUrl.replace(
        '[ITEMID]',
        itemId.split('/').join('$002f')
      )

    const availabilityPageRequest = await agent
      .post(availabilityUrl)
      .set({ 'Content-Type': 'application/x-www-form-urlencoded' })
      .set({ 'X-Requested-With': 'XMLHttpRequest' })
      .set({ sdcsrf: csrf })
      .timeout(TIMEOUTS.LONG)
    const availabilityResponse = availabilityPageRequest.body
    if (availabilityResponse.ids || availabilityResponse.childRecords) {
      availabilityJson = availabilityResponse
    }
  }

  if (availabilityJson?.childRecords) {
    const libs = {}
    $(availabilityJson.childRecords).each(function (i, c) {
      const name = c.LIBRARY
      const status = c.SD_ITEM_STATUS
      common.tallyLibraryAvailability(
        libs,
        name,
        service.Available.indexOf(status) > 0
      )
    })
    for (const lib in libs) {
      availability.push({
        library: lib,
        available: libs[lib].available,
        unavailable: libs[lib].unavailable
      })
    }
    return availability
  }

  if (availabilityJson?.ids) {
    $ = cheerio.load(itemPage)
    const libs = {}
    $('.detailItemsTableRow').each(function () {
      const name = $(this).find('td').eq(0).text().trim()
      const bc = $(this)
        .find('td div')
        .attr('id')
        .replace('availabilityDiv', '')
      if (
        bc &&
        availabilityJson.ids &&
        availabilityJson.ids.length > 0 &&
        availabilityJson.strings &&
        availabilityJson.ids.indexOf(bc) !== -1
      ) {
        const status =
          availabilityJson.strings[availabilityJson.ids.indexOf(bc)].trim()
        common.tallyLibraryAvailability(
          libs,
          name,
          service.Available.indexOf(status) > 0
        )
      }
    })
    for (const lib in libs) {
      availability.push({
        library: lib,
        available: libs[lib].available,
        unavailable: libs[lib].unavailable
      })
    }
    return availability
  }

  if (service.TitleDetailUrl) {
    const titleUrl =
      service.Url +
      service.TitleDetailUrl.replace(
        '[ITEMID]',
        itemId.split('/').join('$002f')
      )

    const titleDetailRequest = await agent
      .post(titleUrl)
      .set({ 'Content-Type': 'application/x-www-form-urlencoded' })
      .set({ 'X-Requested-With': 'XMLHttpRequest' })
      .timeout(TIMEOUTS.LONG)
    const titles = titleDetailRequest.body
    const libs = {}
    $(titles.childRecords).each(function (i, c) {
      const name = c.LIBRARY
      const status = c.SD_ITEM_STATUS
      common.tallyLibraryAvailability(
        libs,
        name,
        service.Available.indexOf(status) > 0
      )
    })
    for (const lib in libs) {
      availability.push({
        library: lib,
        available: libs[lib].available,
        unavailable: libs[lib].unavailable
      })
    }
    return availability
  }
}
