import * as cheerio from 'cheerio'
import request from 'superagent'

import * as common from './common.js'
import { TIMEOUTS } from './config.js'

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

export const createAgent = () => request.agent()

export const fetchAdvancedSearchPage = async (agent, service) => {
  return agent
    .get(`${service.Url}${ADVANCED_SEARCH_URL}`)
    .set(HEADER)
    .timeout(TIMEOUTS.DEFAULT)
}

export const fetchSearchResultsPage = async (agent, service, isbn) => {
  return agent
    .get(`${service.Url}${SEARCH_RESULTS_URL.replace('[ISBN]', isbn)}`)
    .set(HEADER)
    .timeout(TIMEOUTS.DEFAULT)
}

export const fetchCopiesPage = async (agent, service, itemId) => {
  return agent.get(copiesUrl(service, itemId)).set(HEADER).timeout(TIMEOUTS.DEFAULT)
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

export const getLibraries = async service => {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = createAgent()
    const advancedSearchPage = await fetchAdvancedSearchPage(agent, service)
    responseLibraries.libraries = librariesFromAdvancedSearchPage(advancedSearchPage.text)
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = createAgent()
    const searchResultsPage = await fetchSearchResultsPage(agent, service, isbn)
    const firstItem = firstItemFromSearchResults(searchResultsPage.text, service)

    if (!firstItem) return common.endResponse(responseHoldings)

    responseHoldings.id = firstItem.id
    responseHoldings.url = firstItem.url

    const copiesPage = await fetchCopiesPage(agent, service, firstItem.id)
    responseHoldings.availability = availabilityFromCopiesPage(copiesPage.text)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
