import * as cheerio from 'cheerio'

import * as common from './common.js'
import { SPYDUS_COOKIE, TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { SPYDUS_COOKIE, TIMEOUTS } from './config.js'

export const LIBS_URL = 'cgi-bin/spydus.exe/MSGTRN/WPAC/COMB'
export const SEARCH_URL = 'cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ?NRECS=1&ISBN='

export const createAgent = (serviceType = 'spydus') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const libsUrl = service => {
  let url = service.Url + LIBS_URL
  if (service.OpacReference) url = url.replace('WPAC', service.OpacReference)
  if (service.CatalogueReference) { url = url.replace('COMB', service.CatalogueReference) }
  return url
}

export const searchUrl = (service, isbn) => {
  let url = service.Url + SEARCH_URL + isbn
  if (service.OpacReference) url = url.replace('WPAC', service.OpacReference)
  return url
}

export const parseLibraries = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('#LOC option').each(function (idx, option) {
    const libraryName = $(option).text().trim()
    if (common.isLibrary(libraryName)) libraries.push(libraryName)
  })

  return libraries
}

export const hasSearchResults = html =>
  cheerio.load(html)('#result-content-list').length > 0

export const firstResultId = html => {
  const $ = cheerio.load(html)
  let id = $('.card.card-list').first().find('a').attr('name')
  if (!id) {
    id = $('.card.card-list').first().find('input.form-check-input').attr('value')
  }

  return id
}

export const availabilityLink = html => {
  const $ = cheerio.load(html)
  return $('.card-text.availability').first().find('a').attr('href')
}

export const absoluteAvailabilityUrl = (service, availabilityUrl) => {
  if (!availabilityUrl) return null
  return availabilityUrl.startsWith('http')
    ? availabilityUrl
    : service.Url + availabilityUrl
}

export const fetchLibrariesPage = async (serviceType, service) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent
      .get(libsUrl(service))
      .set({ Cookie: SPYDUS_COOKIE })
      .timeout(TIMEOUTS.EXTRA_LONG)
  })
}

export const fetchSearchResultsPage = async (serviceType, service, isbn) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.get(searchUrl(service, isbn)).timeout(TIMEOUTS.EXTRA_LONG)
  })
}

export const fetchAvailabilityPage = async (serviceType, availabilityUrl) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.get(availabilityUrl).timeout(TIMEOUTS.EXTRA_LONG)
  })
}

export const availabilityFromTable = html => {
  const $ = cheerio.load(html)
  const libs = {}
  const availability = []

  $('table tr')
    .slice(1)
    .each(function (i, tr) {
      const name = $(tr).find('td').eq(0).text().trim()
      const status = $(tr).find('td').eq(3).text().trim()
      common.tallyLibraryAvailability(libs, name, status === 'Available')
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
