// HTTP Header:
//  Liferay-Portal: Liferay Community Edition Portal 7.0.6 GA7 (Wilberforce / Build 7006 / April 17, 2018)

import * as cheerio from 'cheerio'
import querystring from 'querystring'
import request from 'superagent'
import xml2js from 'xml2js'

import * as common from './common.js'

const RESULT_URL = 'results'

const SEARCH_URL_PORTLET =
  'search?p_p_id=searchResult_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_search_type=solr&p_r_p_arena_urn:arena_search_query=[BOOKQUERY]'
const ITEM_URL_PORTLET =
  'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=1&p_p_state=normal&p_r_p_arena_urn:arena_search_item_id=[ITEMID]&p_r_p_arena_urn:arena_facet_queries=&p_r_p_arena_urn:arena_agency_name=[ARENANAME]&p_r_p_arena_urn:arena_search_item_no=0&p_r_p_arena_urn:arena_search_type=solr'
const HOLDINGSDETAIL_URL_PORTLET =
  'results?p_p_id=crDetailWicket_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=[RESOURCEID]&p_p_cacheability='

/**
 * Gets the object representing the service
 * @param {object} service
 */
export const getService = service => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
export const getLibraries = async function (service) {
  let botCookie = null
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()
    let $ = null

    if (service.SignupUrl) {
      // Some installations list libraries on the signup page
      const signupResponse = await agent.get(service.SignupUrl).timeout(20000)
      $ = cheerio.load(signupResponse.text)
      if ($('select[name="branches-div:choiceBranch"] option').length > 1) {
        $('select[name="branches-div:choiceBranch"] option').each(function () {
          if (common.isLibrary($(this).text()))
            responseLibraries.libraries.push($(this).text())
        })
        return common.endResponse(responseLibraries)
      }
    }

    // Get the advanced search page
    const advancedSearchResponse = await agent
      .get(service.Url + service.AdvancedUrl)
      .set({ Connection: 'keep-alive' })
      .timeout(20000)

    // The advanced search page may have libraries listed on it
    $ = cheerio.load(advancedSearchResponse.text)
    if ($('.arena-extended-search-branch-choice option').length > 1) {
      $('.arena-extended-search-branch-choice option').each(function () {
        if (common.isLibrary($(this).text()))
          responseLibraries.libraries.push($(this).text())
      })
      return common.endResponse(responseLibraries)
    }

    // If not we'll need to call a portlet to get the data
    const focusedElementId = $(
      '.arena-extended-search-organisation-choice'
    ).attr('id')
    const headers = {
      Accept: 'text/xml',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Wicket-Ajax': true,
      'Wicket-Focusedelementid': focusedElementId
    }
    const url = service.Url + service.AdvancedUrl

    const formData = querystring.stringify({
      p_p_id: 'extendedSearch_WAR_arenaportlet',
      p_p_lifecycle: 2,
      p_p_state: 'normal',
      p_p_mode: 'view',
      p_p_resource_id:
        '/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:',
      p_p_cacheability: 'cacheLevelPage',
      'organisationHierarchyPanel:organisationContainer:organisationChoice':
        service.OrganisationId || ''
    })
    const responseHeaderRequest = await agent
      .post(url)
      .set(headers)
      .send(formData)
      .timeout(20000)
    const js = await xml2js.parseStringPromise(responseHeaderRequest.text)

    // Parse the results of the request
    if (js && js !== 'Undeployed' && js['ajax-response']?.component) {
      $ = cheerio.load(js['ajax-response'].component[0]._)
      $('option').each(function () {
        if (common.isLibrary($(this).text()))
          responseLibraries.libraries.push($(this).text())
      })
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
  let botCookie = null
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = request.agent()

    // Stage 1: Call the search results
    let query = service.SearchType !== 'Keyword' ? 'number_index:' + isbn : isbn
    if (service.OrganisationId) {
      query = 'organisationId_index:' + service.OrganisationId + '+AND+' + query
    }

    const searchUrl = SEARCH_URL_PORTLET.replace('[BOOKQUERY]', query)
    responseHoldings.url = service.Url + searchUrl

    let searchResponse = await agent
      .get(responseHoldings.url)
      .set({ Connection: 'keep-alive' })
      .timeout(20000)

    let cookieResponse = await handleLoadingResponse(agent, searchResponse)
    searchResponse = cookieResponse.response
    const sessionCookies = searchResponse.headers['set-cookie']
    botCookie = cookieResponse.cookieString
    sessionCookies.push(botCookie + ';')
    // Remove Secure and HttpOnly flags from cookies
    // Allow for flexible whitespace and case insensitivity
    for (let i = 0; i < sessionCookies.length; i++) {
      sessionCookies[i] = sessionCookies[i]
        .replace(/;\s*Secure/gi, '')
        .replace(/;\s*HttpOnly/gi, '')
        .replace(/;\s*SameSite=Lax/gi, '')
        .replace(/;\s*SameSite=Strict/gi, '')
    }
    const cookies = sessionCookies.join('; ')

    const resultsText = searchResponse.text
      .replace(/\\x3d/g, '=')
      .replace(/\\x26/g, '&')

    const itemIdIndex = resultsText && resultsText.lastIndexOf('search_item_id')
    if (!itemIdIndex || itemIdIndex === -1) {
      return common.endResponse(responseHoldings)
    }

    // Stage 2: Get the item details page to retrieve holdings
    const itemIdString = resultsText.substring(itemIdIndex + 15)
    const itemIdEndIndex = itemIdString.indexOf('&')
    const itemId = itemIdString.substring(0, itemIdEndIndex)
    responseHoldings.id = itemId

    const itemUrlPortlet = ITEM_URL_PORTLET.replace(
      '[ARENANAME]',
      service.ArenaName
    ).replace('[ITEMID]', itemId)
    const itemUrl = service.Url + itemUrlPortlet

    await new Promise(resolve => setTimeout(resolve, 1000))
    let itemPageResponse = await agent
      .get(itemUrl)
      .set({ Cookie: cookies, Connection: 'keep-alive' })
      .timeout(20000)

    let $ = cheerio.load(itemPageResponse.text)

    if ($('.arena-availability-viewbranch').length > 0) {
      // If the item holdings are available immediately on the page
      $('.arena-availability-viewbranch').each(function () {
        const libName = $(this).find('.arena-branch-name span').text()
        const totalAvailable = $(this)
          .find('.arena-availability-info span')
          .eq(0)
          .text()
          .replace('Total ', '')
        const checkedOut = $(this)
          .find('.arena-availability-info span')
          .eq(1)
          .text()
          .replace('On loan ', '')
        const av =
          (totalAvailable ? parseInt(totalAvailable) : 0) -
          (checkedOut ? parseInt(checkedOut) : 0)
        const nav = checkedOut !== '' ? parseInt(checkedOut) : 0

        if (libName && av + nav > 0) {
          responseHoldings.availability.push({
            library: libName,
            available: av,
            unavailable: nav
          })
        }
      })
      return common.endResponse(responseHoldings)
    }

    // Get the item holdings widget
    const holdingsPanelHeader = {
      Accept: 'text/xml',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Wicket-Ajax': true,
      Cookie: cookies
    }

    const holdingsUrl = service.Url + RESULT_URL
    await new Promise(resolve => setTimeout(resolve, 1000))

    const holdingsPanelPayload = {
      p_p_id: 'crDetailWicket_WAR_arenaportlet',
      p_p_lifecycle: 2,
      p_p_state: 'normal',
      p_p_mode: 'view',
      p_p_resource_id:
        service.HoldingsPanel ||
        '/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel::IBehaviorListener:0:',

      p_p_cacheability: 'cacheLevelPage'
    }

    const holdingsPanelFormData = querystring.stringify(holdingsPanelPayload)
    const holdingsPanelPortletResponse = await agent
      .post(holdingsUrl)
      .set(holdingsPanelHeader)
      .send(holdingsPanelFormData)
      .timeout(20000)
    const js = await xml2js.parseStringPromise(
      holdingsPanelPortletResponse.text
    )

    if (!js['ajax-response'] || !js['ajax-response'].component)
      return common.endResponse(responseHoldings)
    $ = cheerio.load(js['ajax-response'].component[0]._)

    if (
      $(
        '.arena-holding-nof-total, .arena-holding-nof-checked-out, .arena-holding-nof-available-for-loan'
      ).length > 0
    ) {
      $('.arena-holding-child-container').each(function (idx, cont) {
        const libName = $(cont).find('span.arena-holding-link').text()
        const totalAvailable =
          $(cont).find('.arena-holding-nof-total span.arena-value').text() ||
          parseInt(
            $(cont)
              .find('.arena-holding-nof-available-for-loan span.arena-value')
              .text() || 0
          ) +
            parseInt(
              $(cont)
                .find('.arena-holding-nof-checked-out span.arena-value')
                .text() || 0
            )
        const checkedOut = $(cont)
          .find('.arena-holding-nof-checked-out span.arena-value')
          .text()

        const av =
          (totalAvailable ? parseInt(totalAvailable) : 0) -
          (checkedOut ? parseInt(checkedOut) : 0)
        const nav = checkedOut !== '' ? parseInt(checkedOut) : 0

        if (libName && av + nav > 0) {
          responseHoldings.availability.push({
            library: libName,
            available: av,
            unavailable: nav
          })
        }
      })
      return common.endResponse(responseHoldings)
    }

    let currentOrg = null
    let linkId = null
    let holdingsLink = null
    $('.arena-holding-hyper-container .arena-holding-container a span').each(
      function (i) {
        const text = $(this).text().trim()
        const id = $(this).parent().attr('id')
        const link = $(this).parent().attr('href')
        if (text === (service.OrganisationName || service.Name)) {
          currentOrg = i
          linkId = id
          holdingsLink = link
        }
      }
    )
    if (currentOrg == null) return common.endResponse(responseHoldings)

    const holdingsHeaders = {
      Accept: 'text/xml',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Wicket-Ajax': true,
      'Wicket-Focusedelementid': linkId,
      Cookie: cookies
    }

    // Get the interface id from the link
    const holdingsLinkParts = holdingsLink.split('?')[1]
    const holdingsLinkPartsObj = querystring.parse(holdingsLinkParts)
    const p_p_resource_id = holdingsLinkPartsObj.p_p_resource_id
    const interfaceId = p_p_resource_id.substring(
      p_p_resource_id.indexOf('wicket:interface=') + 18,
      p_p_resource_id.indexOf(':recordPanel')
    )

    const holdingsFormData = {
      p_p_id: 'crDetailWicket_WAR_arenaportlet',
      p_p_lifecycle: 2,
      p_p_state: 'normal',
      p_p_mode: 'view',
      p_p_resource_id: `/crDetailWicket/?wicket:interface=:${interfaceId}:recordPanel:panel:holdingsPanel:content:holdingsView:${
        currentOrg + 1
      }:holdingContainer:togglableLink::IBehaviorListener:0:`,
      p_p_cacheability: 'cacheLevelPage'
    }

    // Add the form data to the request body
    const formData = querystring.stringify(holdingsFormData)
    const holdingsResponse = await agent
      .post(holdingsUrl)
      .set(holdingsHeaders)
      .send(formData)
      .timeout(20000)
    const holdingsJs = await xml2js.parseStringPromise(holdingsResponse.text)
    $ = cheerio.load(holdingsJs['ajax-response'].component[0]._)

    const libsData = $('.arena-holding-container')
    const numLibs = libsData.length
    if (!numLibs || numLibs === 0) return common.endResponse(responseHoldings)

    const availabilityRequests = []
    libsData.each(function (i, cont) {
      const linkId = $(cont).find('a')[0].attribs.id
      const resourceId = `/crDetailWicket/?wicket:interface=:${interfaceId}:recordPanel:panel:holdingsPanel:content:holdingsView:${
        currentOrg + 1
      }:childContainer:childView:${i}:holdingPanel:holdingContainer:togglableLink::IBehaviorListener:0:`
      const libUrl =
        service.Url +
        HOLDINGSDETAIL_URL_PORTLET.replace('[RESOURCEID]', resourceId)
      const headers = {
        Accept: 'text/xml',
        'Wicket-Ajax': true,
        'Wicket-FocusedElementId': linkId,
        Cookie: cookies
      }
      availabilityRequests.push(
        agent.get(libUrl).set(headers).timeout(20000)
      )
    })

    const responses = await Promise.all(availabilityRequests)

    responses.forEach(async response => {
      const availabilityJs = await xml2js.parseStringPromise(response.text)
      if (availabilityJs && availabilityJs['ajax-response']) {
        $ = cheerio.load(availabilityJs['ajax-response'].component[0]._)
        const totalAvailable = $(
          '.arena-holding-nof-total span.arena-value'
        ).text()
        const checkedOut = $(
          '.arena-holding-nof-checked-out span.arena-value'
        ).text()
        $ = cheerio.load(availabilityJs['ajax-response'].component[2]._)

        const av =
          (totalAvailable ? parseInt(totalAvailable) : 0) -
          (checkedOut ? parseInt(checkedOut) : 0)
        const nav = checkedOut ? parseInt(checkedOut) : 0

        if (av + nav > 0) {
          responseHoldings.availability.push({
            library: $('span.arena-holding-link').text(),
            available: av,
            unavailable: nav
          })
        }
      }
    })
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}

const isLoadingPage = response => {
  return (
    response && response.text && response.text.indexOf('leastFactor(n)') !== -1
  )
}

const handleLoadingResponse = async (agent, response) => {
  if (!response || !response.text) return response

  let cookieString = null

  // If loading page is detected follow the procedure to run the javascript
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

      // Embed the least factor function inside the go function
      goString = `${leastFactorString}}\n${goString}`

      // We need to dynamically create a function to execute the code returned
      const go = Function(goString)

      cookieString = go()

      response = await agent
        .get(response.request.url)
        .set({ cookie: cookieString })
        .timeout(20000)
      tries += 1
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return { response, cookieString }
  } else {
    return { response, cookieString }
  }
}
