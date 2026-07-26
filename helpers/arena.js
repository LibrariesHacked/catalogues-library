import * as cheerio from 'cheerio'
import querystring from 'querystring'
import request from 'superagent'
import xml2js from 'xml2js'

import { RETRY_DELAY_MS, TIMEOUTS } from './config.js'

export { RETRY_DELAY_MS, TIMEOUTS } from './config.js'

export const RESULT_URL = 'results'

export const SEARCH_URL_PORTLET =
  'search?p_p_id=searchResult_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_search_type=solr&p_r_p_arena_urn:arena_search_query=[BOOKQUERY]'
export const ITEM_URL_PORTLET =
  'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_search_item_id=[ITEMID]&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_agency_name=[ARENANAME]&p_r_p_arena_urn:arena_search_item_no=0&p_r_p_arena_urn:arena_search_type=solr'
export const HOLDINGSDETAIL_URL_PORTLET =
  'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=[RESOURCEID]&p_p_cacheability='

const EXTENDED_SEARCH_PORTLET_ID = 'extendedSearch_WAR_arenaportlet'
const EXTENDED_SEARCH_RESOURCE_ID =
  '/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:'
const HOLDINGS_PORTLET_ID = 'crDetailWicket_WAR_arenaportlet'
const DEFAULT_HOLDINGS_PANEL_RESOURCE_ID =
  '/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel::IBehaviorListener:0:'

export const extendedSearchFormData = service =>
  portletFormData({
    portletId: EXTENDED_SEARCH_PORTLET_ID,
    resourceId: EXTENDED_SEARCH_RESOURCE_ID,
    extraFields: {
      'organisationHierarchyPanel:organisationContainer:organisationChoice':
        service.OrganisationId || ''
    }
  })

export const holdingsPanelFormData = service =>
  portletFormData({ portletId: HOLDINGS_PORTLET_ID, resourceId: service.HoldingsPanel || DEFAULT_HOLDINGS_PANEL_RESOURCE_ID })

export const recordHoldingsFormData = ({ interfaceId, currentOrg, service }) =>
  portletFormData({
    portletId: HOLDINGS_PORTLET_ID,
    resourceId: `/crDetailWicket/?wicket:interface=:${interfaceId}:${service.RecordPanel || 'recordPanel:panel:holdingsPanel'}:content:holdingsView:${
      currentOrg + 1
    }:holdingContainer:togglableLink::IBehaviorListener:0:`
  })

export const childHoldingsFormData = resourceId => portletFormData({ portletId: HOLDINGS_PORTLET_ID, resourceId })

export const itemUrlPortlet = ({ arenaName, itemId }) =>
  ITEM_URL_PORTLET.replace('[ARENANAME]', arenaName).replace('[ITEMID]', itemId)

export const searchUrl = (service, query) =>
  service.Url + SEARCH_URL_PORTLET.replace('[BOOKQUERY]', query)

export const holdingsUrl = service => service.Url + RESULT_URL

export const buildSearchQuery = (service, isbn) => {
  let query = service.SearchType !== 'Keyword' ? 'number_index:' + isbn : isbn
  if (service.OrganisationId) { query = 'organisationId_index:' + service.OrganisationId + '+AND+' + query }

  return query
}

export const decodeText = text => text.replace(/\\x3d/g, '=').replace(/\\x26/g, '&')

export const searchItemId = resultsText => {
  const itemIdIndex = resultsText && resultsText.lastIndexOf('search_item_id')
  if (!itemIdIndex || itemIdIndex === -1) return null

  const itemIdString = resultsText.substring(itemIdIndex + 15)
  const itemIdEndIndex = itemIdString.indexOf('&')

  return itemIdString.substring(0, itemIdEndIndex)
}

export const itemIdFromSearchResponse = responseText =>
  searchItemId(decodeText(responseText))

export const holdingsInterfaceId = holdingsLink => {
  const holdingsLinkParts = holdingsLink.split('?')[1]
  const holdingsLinkPartsObj = querystring.parse(holdingsLinkParts)
  const pPResourceId = holdingsLinkPartsObj.p_p_resource_id // eslint-disable-line camelcase

  return pPResourceId.substring(
    pPResourceId.indexOf('wicket:interface=') + 18,
    pPResourceId.indexOf(':recordPanel')
  )
}

export const viewBranchAvailability = branch => {
  const library = branch.find('.arena-branch-name span').text()
  const totalAvailable = branch
    .find('.arena-availability-info span')
    .eq(0)
    .text()
    .replace('Total ', '')
  const checkedOut = branch
    .find('.arena-availability-info span')
    .eq(1)
    .text()
    .replace('On loan ', '')

  const available =
    (totalAvailable ? parseInt(totalAvailable) : 0) -
    (checkedOut ? parseInt(checkedOut) : 0)
  const unavailable = checkedOut !== '' ? parseInt(checkedOut) : 0

  return library && available + unavailable > 0
    ? { library, available, unavailable }
    : null
}

export const childAvailability = container => {
  const library = container.find('span.arena-holding-link').text()
  const totalAvailable =
    container.find('.arena-holding-nof-total span.arena-value').text() ||
    parseInt(
      container
        .find('.arena-holding-nof-available-for-loan span.arena-value')
        .text() || 0
    ) +
      parseInt(
        container
          .find('.arena-holding-nof-checked-out span.arena-value')
          .text() || 0
      )
  const checkedOut = container
    .find('.arena-holding-nof-checked-out span.arena-value')
    .text()

  const available =
    (totalAvailable ? parseInt(totalAvailable) : 0) -
    (checkedOut ? parseInt(checkedOut) : 0)
  const unavailable = checkedOut !== '' ? parseInt(checkedOut) : 0

  return library && available + unavailable > 0
    ? { library, available, unavailable }
    : null
}

export const listLibraries = (html, selector) => {
  const $ = cheerio.load(html)
  const libraries = []

  $(selector).each(function () {
    const name = $(this).text()
    if (name) libraries.push(name)
  })

  return libraries
}

export const signupLibraries = html =>
  listLibraries(html, 'select[name="branches-div:choiceBranch"] option')

export const advancedSearchLibraries = html =>
  listLibraries(html, '.arena-extended-search-branch-choice option')

export const extendedSearchLibraries = html => listLibraries(html, 'option')

export const extendedSearchFocusedElementId = html =>
  cheerio.load(html)('.arena-extended-search-organisation-choice').attr('id')

export const branchAvailability = html => {
  const $ = cheerio.load(html)
  const availability = []

  $('.arena-availability-viewbranch').each(function () {
    const item = viewBranchAvailability($(this))
    if (item) availability.push(item)
  })

  return availability
}

export const childAvailabilities = html => {
  const $ = cheerio.load(html)
  const availability = []

  $('.arena-holding-child-container').each(function (idx, cont) {
    const item = childAvailability($(cont))
    if (item) availability.push(item)
  })

  return availability
}

export const currentHoldingLink = (html, serviceName) => {
  const $ = cheerio.load(html)
  let currentOrg = null
  let linkId = null
  let holdingsLink = null

  $('.arena-holding-hyper-container .arena-holding-container a span').each(
    function (i) {
      const text = $(this).text().trim()
      const id = $(this).parent().attr('id')
      const link = $(this).parent().attr('href')
      if (text === serviceName) {
        currentOrg = i
        linkId = id
        holdingsLink = link
      }
    }
  )

  return currentOrg == null ? null : { currentOrg, linkId, holdingsLink }
}

export const recordAvailabilities = html => {
  const $ = cheerio.load(html)
  const availability = []

  $('.arena-holding-container').each(function () {
    const item = childAvailability($(this))
    if (item) availability.push(item)
  })

  return availability
}

export const childResponseAvailability = async responseText => {
  const availabilityJs = await xml2js.parseStringPromise(responseText)
  if (!availabilityJs || !availabilityJs['ajax-response']?.component) return null

  const $ = cheerio.load(availabilityJs['ajax-response'].component[0]._)
  const totalAvailable = $('.arena-holding-nof-total span.arena-value').text()
  const checkedOut = $('.arena-holding-nof-checked-out span.arena-value').text()
  const childHtml = cheerio.load(availabilityJs['ajax-response'].component[2]._)

  const available =
    (totalAvailable ? parseInt(totalAvailable) : 0) -
    (checkedOut ? parseInt(checkedOut) : 0)
  const unavailable = checkedOut ? parseInt(checkedOut) : 0

  return available + unavailable > 0
    ? {
        library: childHtml('span.arena-holding-link').text(),
        available,
        unavailable
      }
    : null
}

export const childContainerRows = html =>
  html.match(/<div class="arena-holding-container"[\s\S]*?<\/div>/g) || []

export const childContainerLinkId = containerHtml =>
  (containerHtml.match(/<a[^>]*id="([^"]+)"/) || [])[1] || null

export const recordPanelResId = ({ interfaceId, currentOrg, service }) =>
  `/crDetailWicket/?wicket:interface=:${interfaceId}:${service.RecordPanel || 'recordPanel:panel:holdingsPanel'}:content:holdingsView:${currentOrg + 1}:holdingContainer:togglableLink::IBehaviorListener:0:`

export const childPanelResId = ({ interfaceId, currentOrg, service, idx }) =>
  `/crDetailWicket/?wicket:interface=:${interfaceId}:${service.RecordPanel || 'recordPanel:panel:holdingsPanel'}:content:holdingsView:${currentOrg + 1}:childContainer:childView:${idx}:holdingPanel:holdingContainer:togglableLink::IBehaviorListener:0:`

export const responseComponentHtml = responseText => {
  return xml2js.parseStringPromise(responseText).then(parsed =>
    parsed && parsed['ajax-response']?.component ? parsed['ajax-response'].component[0]._ : null
  )
}

export const getSignupResponse = async service => {
  const agent = request.agent()
  return agent.get(service.SignupUrl).timeout(TIMEOUTS.DEFAULT)
}

export const getAdvancedSearchResponse = async service => {
  const agent = request.agent()
  return agent
    .get(service.Url + service.AdvancedUrl)
    .set(keepAliveHeaders())
    .timeout(TIMEOUTS.DEFAULT)
}

export const postExtendedSearchPortlet = async (service, focusedElementId) => {
  const agent = request.agent()
  const url = service.Url + service.AdvancedUrl
  const headers = ajaxHeaders({ focusedElementId })
  const formData = extendedSearchFormData(service)

  return agent.post(url).set(headers).send(formData).timeout(TIMEOUTS.DEFAULT)
}

export const getSearchResponse = async (service, query) => {
  const agent = request.agent()
  const url = service.Url + SEARCH_URL_PORTLET.replace('[BOOKQUERY]', query)
  return agent.get(url).set(keepAliveHeaders()).timeout(TIMEOUTS.DEFAULT)
}

export const getSearchResponseWithCookies = async (service, query) => {
  const agent = request.agent()
  const response = await getSearchResponse(service, query)
  const cookieResponse = await handleLoadingResponse(agent, response)

  return {
    response: cookieResponse.response,
    cookieString: cookieResponse.cookieString
  }
}

export const getItemResponse = async (service, itemId, cookies) => {
  const agent = request.agent()
  const itemUrl = service.Url + itemUrlPortlet({ arenaName: service.ArenaName, itemId })

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
  return agent.get(itemUrl).set(keepAliveHeaders(cookies)).timeout(TIMEOUTS.DEFAULT)
}

export const getHoldingsResponse = async (service, cookies) => {
  const agent = request.agent()
  const holdingsUrl = service.Url + RESULT_URL
  const holdingsHeaders = ajaxHeaders({ cookie: cookies })
  const holdingsFormData = holdingsPanelFormData(service)

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
  return agent.post(holdingsUrl).set(holdingsHeaders).send(holdingsFormData).timeout(TIMEOUTS.DEFAULT)
}

export const postRecordResponse = async ({ service, holdingsUrl, cookies, focusedElementId, interfaceId, currentOrg }) => {
  const agent = request.agent()
  const recordHeaders = ajaxHeaders({ focusedElementId, cookie: cookies })
  const recordFormData = recordHoldingsFormData({ interfaceId, currentOrg, service })

  return agent.post(holdingsUrl).set(recordHeaders).send(recordFormData).timeout(TIMEOUTS.DEFAULT)
}

export const postChildResponse = async ({ service, holdingsUrl, cookies, focusedElementId, interfaceId, currentOrg, idx }) => {
  const agent = request.agent()
  const childHeaders = ajaxHeaders({ focusedElementId, cookie: cookies, includeContentType: false })
  const childFormData = childHoldingsFormData(childPanelResId({ interfaceId, currentOrg, service, idx }))

  return agent.post(holdingsUrl).set(childHeaders).send(childFormData).timeout(TIMEOUTS.DEFAULT)
}

export const keepAliveHeaders = cookie => {
  const headers = { Connection: 'keep-alive' }

  if (cookie) headers.Cookie = cookie

  return headers
}

export const ajaxHeaders = ({
  focusedElementId,
  cookie,
  includeContentType = true
} = {}) => {
  const headers = {
    Accept: 'text/xml',
    'Wicket-Ajax': true
  }

  if (includeContentType) { headers['Content-Type'] = 'application/x-www-form-urlencoded' }
  if (focusedElementId) headers['Wicket-Focusedelementid'] = focusedElementId
  if (cookie) headers.Cookie = cookie

  return headers
}

export const portletFormData = ({
  portletId,
  resourceId,
  extraFields = {}
}) =>
  querystring.stringify({
    p_p_id: portletId,
    p_p_lifecycle: 2,
    p_p_state: 'normal',
    p_p_mode: 'view',
    p_p_resource_id: resourceId,
    p_p_cacheability: 'cacheLevelPage',
    ...extraFields
  })

const isLoadingPage = response => {
  return (
    response && response.text && response.text.indexOf('leastFactor(n)') !== -1
  )
}

export const handleLoadingResponse = async (agent, response) => {
  if (!response || !response.text) return response

  let cookieString = null

  if (isLoadingPage(response)) {
    let tries = 0
    while (tries < 2 && response && isLoadingPage(response)) {
      const respText = response.text
      const leastFactorStart = respText.indexOf('function leastFactor(n) {')
      const leastFactorEnd = respText.indexOf('return n;', leastFactorStart) + 9
      const leastFactorString = respText.substring(
        leastFactorStart,
        leastFactorEnd
      )
      const goStart = respText.indexOf('function go() {') + 15
      const goEnd =
        respText.indexOf('document.location.reload(true); }', goStart) + 33

      let goString = respText
        .substring(goStart, goEnd)
        .replace('document.location.reload(true);', '')
        .replace('document.cookie=', '; return ')

      goString = `${leastFactorString}}\n${goString}`

      // eslint-disable-next-line no-new-func
      const go = Function(goString)

      cookieString = go()

      response = await agent
        .get(response.request.url)
        .set({ cookie: cookieString })
        .timeout(TIMEOUTS.DEFAULT)
      tries += 1
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
    return { response, cookieString }
  }

  return { response, cookieString }
}
