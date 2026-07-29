import xml2js from 'xml2js'

import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { TIMEOUTS } from './config.js'

export const ITEM_SEARCH =
  'fu=BibSearch&RequestType=ResultSet_DisplayList&NumberToRetrieve=10&StartValue=1&SearchTechnique=Find&Language=eng&Profile=Iguana&ExportByTemplate=Brief&TemplateId=Iguana_Brief&FacetedSearch=Yes&MetaBorrower=&Cluster=0&Namespace=0&BestMatch=99&ASRProfile=&Sort=Relevancy&SortDirection=1&WithoutRestrictions=Yes&Associations=Also&Application=Bib&Database=[DB]&Index=Keywords&Request=[ISBN]&SessionCMS=&CspSessionId=[SID]&SearchMode=simple&SIDTKN=[SID]'

export const FACET_SEARCH =
  'FacetedSearch=[RESULTID]&FacetsFound=&fu=BibSearch&SIDTKN=[SID]'

export const HEADER = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'X-Requested-With': 'XMLHttpRequest'
}

export const HOME = 'www.main.cls'

export const serviceUrl = service => service.Url + HOME

export const createAgent = (serviceType = 'iguana') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const searchEndpointUrl = service => service.Url + 'Proxy.SearchRequest.cls'

export const searchBody = ({ service, isbn, sid }) =>
  ITEM_SEARCH.replace('[ISBN]', isbn)
    .replace('[DB]', service.Database)
    .replace('[TID]', 'Iguana_Brief')
    .replace(/\[SID\]/g, sid)

export const librariesSearchBody = ({ service, sid }) =>
  searchBody({ service, isbn: 'harry', sid }).replace(
    'Index=Isbn',
    'Index=Keywords'
  )

export const facetBody = ({ resultId, sid }) =>
  FACET_SEARCH.replace('[RESULTID]', resultId).replace(/\[SID\]/g, sid)

export const sidFromCookie = sessionCookie => {
  const iguanaCookieIndex = sessionCookie.indexOf('iguana-=')
  return sessionCookie.substring(iguanaCookieIndex + 20, iguanaCookieIndex + 30)
}

export const getSid = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
    const homePageRequest = await agent.get(serviceUrl(service))
    const sessionCookie = homePageRequest.headers['set-cookie'][0]
    return sidFromCookie(sessionCookie)
  })
}

export const postSearch = async (sessionId, service, body) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
    return agent
      .post(searchEndpointUrl(service))
      .send(body)
      .set({ ...HEADER, Referer: serviceUrl(service) })
      .timeout(TIMEOUTS.DEFAULT)
      .buffer()
  })
}

export const parseXml = async xmlText => xml2js.parseStringPromise(xmlText)

export const facetLibrariesFromSearch = (searchJs, facetJs, service) => {
  const libraries = []
  const facets = facetJs?.VubisFacetedSearchResponse?.Facets?.[0]?.Facet
  if (!facets) return libraries

  facets.forEach(facet => {
    if (facet.FacetWording[0] === service.LibraryFacet) {
      facet.FacetEntry.forEach(location => libraries.push(location.Display[0]))
    }
  })

  return libraries
}

export const shelfmarkLibrariesFromSearch = searchJs => {
  const libraries = []
  if (!searchJs?.searchRetrieveResponse?.records) return libraries

  searchJs.searchRetrieveResponse.records[0].record.forEach(record => {
    const recData = record.recordData
    if (
      recData &&
      recData[0] &&
      recData[0].BibDocument &&
      recData[0].BibDocument[0] &&
      recData[0].BibDocument[0].HoldingsSummary &&
      recData[0].BibDocument[0].HoldingsSummary[0]
    ) {
      recData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach(item => {
        const lib = item.Shelfmark[0].split(' : ')[0]
        if (libraries.indexOf(lib) === -1) libraries.push(lib)
      })
    }
  })

  return libraries
}

export const firstResultRecord = searchJs => {
  if (
    searchJs?.searchRetrieveResponse &&
    !searchJs.searchRetrieveResponse.bestMatch &&
    searchJs.searchRetrieveResponse.records &&
    searchJs.searchRetrieveResponse.records[0].record
  ) {
    return searchJs.searchRetrieveResponse.records[0]?.record[0]
  }

  return null
}

export const recordId = record => {
  if (record?.recordData && record.recordData[0]?.BibDocument?.[0]) {
    return record.recordData[0].BibDocument[0].Id[0]
  }

  return null
}

export const availabilityFromRecord = record => {
  const availability = []
  if (
    !record?.recordData ||
    !record.recordData[0] ||
    !record.recordData[0].BibDocument?.[0] ||
    !record.recordData[0].BibDocument[0].HoldingsSummary
  ) {
    return availability
  }

  record.recordData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach(
    item => {
      if (item.Shelfmark && item.Available) {
        const lib = item.Shelfmark[0].split(' : ')[0]
        availability.push({
          library: lib,
          available: item.Available ? parseInt(item.Available[0]) : 0,
          unavailable: item.Available[0] === '0' ? 1 : 0
        })
      }
    }
  )

  return availability
}
