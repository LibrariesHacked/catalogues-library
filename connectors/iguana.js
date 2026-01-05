import request from 'superagent'
import xml2js from 'xml2js'

import * as common from '../connectors/common.js'

const ITEM_SEARCH =
  'fu=BibSearch&RequestType=ResultSet_DisplayList&NumberToRetrieve=10&StartValue=1&SearchTechnique=Find&Language=eng&Profile=Iguana&ExportByTemplate=Brief&TemplateId=Iguana_Brief&FacetedSearch=Yes&MetaBorrower=&Cluster=0&Namespace=0&BestMatch=99&ASRProfile=&Sort=Relevancy&SortDirection=1&WithoutRestrictions=Yes&Associations=Also&Application=Bib&Database=[DB]&Index=Keywords&Request=[ISBN]&SessionCMS=&CspSessionId=[SID]&SearchMode=simple&SIDTKN=[SID]'
const FACET_SEARCH =
  'FacetedSearch=[RESULTID]&FacetsFound=&fu=BibSearch&SIDTKN=[SID]'
const HEADER = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'X-Requested-With': 'XMLHttpRequest'
}
const HOME = 'www.main.cls'

/**
 * Gets the object representing the service
 * @param {object} service
 */
export const getService = service => {
  const serviceData = common.getService(service)
  serviceData.url = service.Url + HOME
  return serviceData
}

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
export const getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()

    const homePageRequest = await agent.get(service.Url + HOME)
    const sessionCookie = homePageRequest.headers['set-cookie'][0]
    const iguanaCookieIndex = sessionCookie.indexOf('iguana-=')
    const sid = sessionCookie.substring(
      iguanaCookieIndex + 20,
      iguanaCookieIndex + 30
    )

    const body = ITEM_SEARCH.replace('[ISBN]', 'harry')
      .replace('Index=Isbn', 'Index=Keywords')
      .replace('[DB]', service.Database)
      .replace('[TID]', 'Iguana_Brief')
      .replace(/\[SID\]/g, sid)

    const searchUrl = service.Url + 'Proxy.SearchRequest.cls'
    const searchPageRequest = await agent
      .post(searchUrl)
      .send(body)
      .set({ ...HEADER, Referer: service.Url + HOME })
      .timeout(20000)
      .buffer()
    const searchJs = await xml2js.parseStringPromise(searchPageRequest.text)

    if (service.Faceted) {
      const resultId = searchJs.searchRetrieveResponse.resultSetId[0]

      const facetRequest = await agent
        .post(service.Url + 'Proxy.SearchRequest.cls')
        .send(
          FACET_SEARCH.replace('[RESULTID]', resultId).replace(/\[SID\]/g, sid)
        )
        .set({ ...HEADER, Referer: service.Url + HOME })
        .timeout(20000)
        .buffer()
      const facetJs = await xml2js.parseStringPromise(facetRequest.text)
      const facets = facetJs.VubisFacetedSearchResponse.Facets[0].Facet

      if (facets) {
        facets.forEach(facet => {
          if (facet.FacetWording[0] === service.LibraryFacet) {
            facet.FacetEntry.forEach(location =>
              responseLibraries.libraries.push(location.Display[0])
            )
          }
        })
      }
    } else {
      if (
        searchJs &&
        searchJs.searchRetrieveResponse &&
        searchJs.searchRetrieveResponse.records
      ) {
        searchJs.searchRetrieveResponse.records[0].record.forEach(function (
          record
        ) {
          const recData = record.recordData
          if (
            recData &&
            recData[0] &&
            recData[0].BibDocument &&
            recData[0].BibDocument[0] &&
            recData[0].BibDocument[0].HoldingsSummary &&
            recData[0].BibDocument[0].HoldingsSummary[0]
          ) {
            recData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach(
              item => {
                const lib = item.Shelfmark[0].split(' : ')[0]
                if (responseLibraries.libraries.indexOf(lib) === -1)
                  responseLibraries.libraries.push(lib)
              }
            )
          }
        })
      }
    }
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
export const searchByISBN = async function (isbn, service) {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = request.agent()

    const homePageRequest = await agent.get(service.Url + HOME)
    const sessionCookie = homePageRequest.headers['set-cookie'][0]
    const iguanaCookieIndex = sessionCookie.indexOf('iguana-=')
    const sid = sessionCookie.substring(
      iguanaCookieIndex + 20,
      iguanaCookieIndex + 30
    )
    const searchPageRequest = await agent
      .post(service.Url + 'Proxy.SearchRequest.cls')
      .set({ ...HEADER, Referer: service.Url + HOME })
      .send(
        ITEM_SEARCH.replace('[ISBN]', isbn)
          .replace('[DB]', service.Database)
          .replace('[TID]', 'Iguana_Brief')
          .replace(/\[SID\]/g, sid)
      )
      .timeout(20000)
      .buffer()
    const searchJs = await xml2js.parseStringPromise(searchPageRequest.text)

    let record = null
    if (
      searchJs?.searchRetrieveResponse &&
      !searchJs.searchRetrieveResponse.bestMatch &&
      searchJs.searchRetrieveResponse.records &&
      searchJs.searchRetrieveResponse.records[0].record
    )
      record = searchJs.searchRetrieveResponse.records[0]?.record[0]

    if (
      record?.recordData &&
      record.recordData[0] &&
      record.recordData[0].BibDocument[0]
    ) {
      responseHoldings.id = record.recordData[0].BibDocument[0].Id[0]
    }

    if (
      record?.recordData &&
      record.recordData[0] &&
      record.recordData[0].BibDocument[0] &&
      record.recordData[0].BibDocument[0].HoldingsSummary
    ) {
      record.recordData[0].BibDocument[0].HoldingsSummary[0].ShelfmarkData.forEach(
        function (item) {
          if (item.Shelfmark && item.Available) {
            const lib = item.Shelfmark[0].split(' : ')[0]
            responseHoldings.availability.push({
              library: lib,
              available: item.Available ? parseInt(item.Available[0]) : 0,
              unavailable: item.Available[0] === '0' ? 1 : 0
            })
          }
        }
      )
    }
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
