import request from 'superagent'
import xml2js from 'xml2js'

import * as common from './common.js'
import { TIMEOUTS } from './config.js'

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

export const createAgent = () => request.agent()

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

export const getSid = async service => {
  const agent = createAgent()
  const homePageRequest = await agent.get(serviceUrl(service))
  const sessionCookie = homePageRequest.headers['set-cookie'][0]
  return sidFromCookie(sessionCookie)
}

export const postSearch = async (agent, service, body) => {
  return agent
    .post(searchEndpointUrl(service))
    .send(body)
    .set({ ...HEADER, Referer: serviceUrl(service) })
    .timeout(TIMEOUTS.DEFAULT)
    .buffer()
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

export const getLibraries = async service => {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = createAgent()
    const sid = await getSid(service)
    const searchPageRequest = await postSearch(
      agent,
      service,
      librariesSearchBody({ service, sid })
    )
    const searchJs = await parseXml(searchPageRequest.text)

    if (service.Faceted) {
      const resultId = searchJs.searchRetrieveResponse.resultSetId[0]
      const facetRequest = await postSearch(agent, service, facetBody({ resultId, sid }))
      const facetJs = await parseXml(facetRequest.text)
      responseLibraries.libraries = facetLibrariesFromSearch(searchJs, facetJs, service)
    } else {
      responseLibraries.libraries = shelfmarkLibrariesFromSearch(searchJs)
    }
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = createAgent()
    const sid = await getSid(service)

    const searchPageRequest = await postSearch(
      agent,
      service,
      searchBody({ service, isbn, sid })
    )
    const searchJs = await parseXml(searchPageRequest.text)
    const record = firstResultRecord(searchJs)
    responseHoldings.id = recordId(record)
    responseHoldings.availability = availabilityFromRecord(record)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
