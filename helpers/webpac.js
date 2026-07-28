import * as cheerio from 'cheerio'

import * as common from './common.js'
import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { TIMEOUTS } from './config.js'

export const librariesSearchUrl = service => service.Url + 'search/X'

export const holdingsSearchUrl = (service, isbn) =>
  service.Url + 'search~S1/?searchtype=i&searcharg=' + isbn

export const createAgent = (serviceType = 'webpac') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const parseHtml = html => cheerio.load(html)

export const fetchLibrariesPage = async (serviceType, service) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.get(librariesSearchUrl(service)).timeout(TIMEOUTS.EXTRA_LONG)
  })
}

export const librariesFromPage = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('select[Name=searchscope] option').each((idx, option) => {
    if (common.isLibrary($(option).text().trim())) { libraries.push($(option).text().trim()) }
  })

  return libraries
}

export const fetchHoldingsSearchPage = async (serviceType, service, isbn) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.get(holdingsSearchUrl(service, isbn)).timeout(TIMEOUTS.EXTRA_LONG)
  })
}

export const getLibraries = async service => {
  const agent = createAgent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const advancedSearchPageRequest = await fetchLibrariesPage(agent, service)
    responseLibraries.libraries = librariesFromPage(advancedSearchPageRequest.text)
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const getItemId = html => {
  const $ = cheerio.load(html)
  return $('#recordnum').attr('href').replace('/record=', '')
}

export const getLibrariesAvailability = html => {
  const $ = cheerio.load(html)
  const libs = {}
  $('table.bibItems tr.bibItemsEntry').each(function (idx, tr) {
    const name = $(tr).find('td').eq(0).text().trim()
    const status = $(tr).find('td').eq(3).text().trim()
    common.tallyLibraryAvailability(
      libs,
      name,
      status === 'AVAILABLE' || status === 'FOR LOAN'
    )
  })

  const availability = []
  for (const l in libs) {
    availability.push({
      library: l,
      available: libs[l].available,
      unavailable: libs[l].unavailable
    })
  }

  return availability
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = holdingsSearchUrl(service, isbn)
  const agent = createAgent()

  try {
    const responseHoldingsRequest = await fetchHoldingsSearchPage(agent, service, isbn)
    const $ = cheerio.load(responseHoldingsRequest.text)
    responseHoldings.id = getItemId($)
    responseHoldings.availability = getLibrariesAvailability($)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
