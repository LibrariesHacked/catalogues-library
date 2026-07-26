import * as cheerio from 'cheerio'
import request from 'superagent'
import UserAgent from 'user-agents'

import * as common from './common.js'
import { TIMEOUTS } from './config.js'

export { TIMEOUTS } from './config.js'

export const CAT_URL = 'cgi-bin/koha/opac-search.pl?format=rss2&idx=nb&q='
export const LIBS_URL =
  'cgi-bin/koha/opac-search.pl?[MULTIBRANCH]do=Search&expand=holdingbranch#holdingbranch_id'
export const HEADER = {
  'User-Agent': new UserAgent().toString()
}

export const librariesUrl = service =>
  service.Url +
  LIBS_URL.replace(
    '[MULTIBRANCH]',
    service.MultiBranchLimit
      ? 'multibranchlimit=' + service.MultiBranchLimit + '&'
      : ''
  )

export const createAgent = () => request.agent()

export const fetchLibrariesPage = async (agent, service) => {
  return agent
    .get(librariesUrl(service))
    .set(HEADER)
    .timeout(TIMEOUTS.EXTRA_LONG)
}

export const librariesFromPage = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('#branchloop option').each((idx, option) => {
    if (common.isLibrary($(option).text())) { libraries.push($(option).text().trim()) }
  })
  $('li#holdingbranch_id ul li span.facet-label').each((idx, label) => {
    libraries.push($(label).text().trim())
  })
  $('li#homebranch_id ul li span.facet-label').each((idx, label) => {
    libraries.push($(label).text().trim())
  })

  return libraries
}

export const fetchSearchFeed = async (agent, service, isbn) => {
  return agent
    .get(service.Url + CAT_URL + isbn)
    .set(HEADER)
    .timeout(TIMEOUTS.LONG)
}

export const firstBibLink = searchXml => {
  const $ = cheerio.load(searchXml, {
    normalizeWhitespace: true,
    xmlMode: true
  })

  return {
    deepLink: $('link').first().text(),
    bibLink: $('guid').text()
  }
}

export const bibIdFromLink = bibLink => bibLink.substring(bibLink.lastIndexOf('=') + 1)

export const fetchBibItemsPage = async (agent, bibLink) => {
  return agent
    .get(bibLink + '&viewallitems=1')
    .set(HEADER)
    .timeout(TIMEOUTS.LONG)
}

export const availabilityFromBibItemsPage = html => {
  const $ = cheerio.load(html)
  const libs = {}
  const availability = []

  $('#holdingst tbody, .holdingst tbody')
    .find('tr')
    .each((idx, table) => {
      const lib = $(table).find('td.location span span').first().text().trim()
      common.tallyLibraryAvailability(
        libs,
        lib,
        $(table).find('td.status span').text().trim() === 'Available'
      )
    })

  for (const l in libs) {
    availability.push({
      library: l,
      available: libs[l].available,
      unavailable: libs[l].unavailable
    })
  }

  return availability
}

export const getLibraries = async service => {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = createAgent()
    const libraryPageRequest = await fetchLibrariesPage(agent, service)
    responseLibraries.libraries = librariesFromPage(libraryPageRequest.text)
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url

  try {
    const agent = createAgent()
    const searchPageRequest = await fetchSearchFeed(agent, service, isbn)
    const firstResult = firstBibLink(searchPageRequest.text)
    responseHoldings.url = firstResult.deepLink

    const bibLink = firstResult.bibLink
    if (!bibLink) return common.endResponse(responseHoldings)

    responseHoldings.id = bibIdFromLink(bibLink)
    responseHoldings.url = bibLink

    const itemPageRequest = await fetchBibItemsPage(agent, bibLink)
    responseHoldings.availability = availabilityFromBibItemsPage(itemPageRequest.text)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
