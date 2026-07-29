import * as cheerio from 'cheerio'

import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

import UserAgent from 'user-agents'

export { TIMEOUTS } from './config.js'

export const HEADER = {
  'User-Agent': new UserAgent({ deviceCategory: 'mobile' }).toString()
}

export const ADVANCED_SEARCH_URL =
  'Union/Search?view=list&lookfor=&searchIndex=advanced&searchSource=local'

export const SEARCH_RESULTS_URL =
  'Union/Search?view=list&lookfor=[ISBN]&searchIndex=Keyword&searchSource=local'

export const copiesUrl = (service, itemId) =>
  `${service.Url}GroupedWork/${itemId}/AJAX?method=getCopyDetails&format=Book&recordId=${itemId}`

export const createAgent = (serviceType = 'aspen') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const fetchAdvancedSearchPage = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .get(`${service.Url}${ADVANCED_SEARCH_URL}`)
      .set('User-Agent', userAgent)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const fetchSearchResultsPage = async (sessionId, service, isbn) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .get(`${service.Url}${SEARCH_RESULTS_URL.replace('[ISBN]', isbn)}`)
      .set('User-Agent', userAgent)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const fetchCopiesPage = async (sessionId, service, itemId) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .get(copiesUrl(service, itemId))
      .set('User-Agent', userAgent)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const librariesFromAdvancedSearchPage = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('option').each((i, el) => {
    if (!$(el).val().includes('owning_location:')) return

    libraries.push($(el).text().trim())
  })

  return libraries
}

export const firstItemFromSearchResults = (html, service) => {
  const $ = cheerio.load(html)
  const firstItem = $('.resultsList').find('a').first()
  const itemId = firstItem.attr('id')?.replace('record', '')

  if (!itemId) return null

  return {
    id: itemId,
    url: `${service.Url}GroupedWork/${itemId}`
  }
}

export const availabilityFromCopiesPage = copiesJsonText => {
  const copiesHtml = JSON.parse(copiesJsonText).modalBody
  const $ = cheerio.load(copiesHtml)
  const availability = []

  $('table tbody tr').each((i, tr) => {
    const copiesText = $(tr).find('td').eq(0).text().trim()
    const [availableText, totalText] = copiesText.split(' of ')
    const total = parseInt(totalText)
    const available = parseInt(availableText)
    const unavailable = total - available
    const library = $(tr).find('td').eq(1).text().trim()
    availability.push({ library, available, unavailable })
  })

  return availability
}
