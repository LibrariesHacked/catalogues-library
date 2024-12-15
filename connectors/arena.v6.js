// HTTP Header:
//  Liferay-Portal: Liferay Portal Community Edition 6.2 CE GA6 (Newton / Build 6205 / January 6, 2016)

const cheerio = require('cheerio')
const querystring = require('querystring')
const request = require('superagent')
const xml2js = require('xml2js')

const common = require('./common')

const LIBRARIES_URL_PORTLETS =
  '?p_p_id=extendedSearch_WAR_arenaportlets&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465extended-search?p_p_id=extendedSearch_WAR_arenaportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/extendedSearch/?wicket:interface=:0:extendedSearchPanel:extendedSearchForm:organisationHierarchyPanel:organisationContainer:organisationChoice::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&random=0.08709241788681465'
const SEARCH_URL_PORTLETS =
  'search?p_p_id=searchResult_WAR_arenaportlets&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_r_p_687834046_facet_queries=&p_r_p_687834046_search_type=solr&p_r_p_687834046_search_query=[BOOKQUERY]'
const ITEM_URL_PORTLETS =
  'results?p_p_id=crDetailWicket_WAR_arenaportlets&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-2&p_p_col_pos=2&p_p_col_count=4&p_r_p_687834046_facet_queries=&p_r_p_687834046_search_item_no=0&p_r_p_687834046_sort_advice=field%3DRelevance%26direction%3DDescending&p_r_p_687834046_search_type=solr&p_r_p_687834046_search_item_id=[ITEMID]&p_r_p_687834046_agency_name=[ARENANAME]'
const HOLDINGS_URL_PORTLETS =
  'results?p_p_id=crDetailWicket_WAR_arenaportlets&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel::IBehaviorListener:0:&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_pos=1&p_p_col_count=3'
const HOLDINGSDETAIL_URL_PORTLETS =
  'results?p_p_id=crDetailWicket_WAR_arenaportlets&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=[RESOURCEID]&p_p_cacheability='

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = service => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)
  let $ = null

  try {
    const agent = request.agent()

    if (service.PreLoad) {
      // Get necessary session cookies
      await agent.get(service.Url)
    }

    if (service.SignupUrl) {
      // This service needs to be loaded using the signup page rather
      // than the advanced search page.
      const signupResponse = await agent.get(service.SignupUrl)
      $ = cheerio.load(signupResponse.text)

      if ($('select[name="choiceBranch"] option').length > 1) {
        $('select[name="choiceBranch"] option').each(function () {
          if (common.isLibrary($(this).text())) {
            responseLibraries.libraries.push($(this).text())
          }
        })
        return common.endResponse(responseLibraries)
      }
    }

    // Get the advanced search page
    const advancedSearchResponse = await agent.get(
      service.Url + service.AdvancedUrl
    )

    // The advanced search page may have libraries listed on it
    $ = cheerio.load(advancedSearchResponse.text)
    if ($('.arena-extended-search-branch-choice option').length > 1) {
      $('.arena-extended-search-branch-choice option').each(function () {
        if (common.isLibrary($(this).text())) {
          responseLibraries.libraries.push($(this).text())
        }
      })
      return common.endResponse(responseLibraries)
    }

    // If not we'll need to call a portlet to get the data
    const headers = {
      Accept: 'text/xml',
      'Wicket-Ajax': true,
      'Wicket-FocusedElementId': 'id__extendedSearch__WAR__arenaportlet____e',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const url = service.Url + service.AdvancedUrl + LIBRARIES_URL_PORTLETS
    const responseHeaderRequest = await agent
      .post(url)
      .send(
        querystring.stringify({
          'organisationHierarchyPanel:organisationContainer:organisationChoice':
            service.OrganisationId
        })
      )
      .set(headers)
    const js = await xml2js.parseStringPromise(responseHeaderRequest.text)

    // Parse the results of the request
    if (js && js !== 'Undeployed' && js['ajax-response']?.component) {
      $ = cheerio.load(js['ajax-response'].component[0]._)
      $('option').each(function () {
        if (common.isLibrary($(this).text())) {
          responseLibraries.libraries.push($(this).text())
        }
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
exports.searchByISBN = async function (isbn, service) {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = request.agent()

    // let bookQuery = (service.SearchType !== 'Keyword' ? service.ISBNAlias + '_index:' + isbn : isbn)
    let bookQuery = `number_index:${isbn}`
    if (service.OrganisationId) {
      bookQuery =
        'organisationId_index:' + service.OrganisationId + '+AND+' + bookQuery
    }

    const searchUrl = SEARCH_URL_PORTLETS.replace('[BOOKQUERY]', bookQuery)
    responseHoldings.url = service.Url + searchUrl

    const searchResponse = await agent.get(responseHoldings.url).timeout(20000)

    // No item found
    if (
      !searchResponse ||
      !searchResponse.text ||
      (searchResponse.text &&
        searchResponse.text.lastIndexOf('search_item_id') === -1)
    ) {
      return common.endResponse(responseHoldings)
    }

    // Call to the item page
    const pageText = searchResponse.text
      .replace(/\\x3d/g, '=')
      .replace(/\\x26/g, '&')
    let itemId = pageText.substring(
      pageText.lastIndexOf('search_item_id=') + 15
    )
    itemId = itemId.substring(0, itemId.indexOf('&'))
    responseHoldings.id = itemId

    const itemDetailsUrl = ITEM_URL_PORTLETS.replace(
      '[ARENANAME]',
      service.ArenaName
    ).replace('[ITEMID]', itemId)
    const itemUrl = service.Url + itemDetailsUrl

    const itemPageResponse = await agent
      .get(itemUrl)
      .set({ Connection: 'keep-alive' })
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
    const holdingsPanelHeader = { Accept: 'text/xml', 'Wicket-Ajax': true }
    const holdingsPanelUrl = service.Url + HOLDINGS_URL_PORTLETS

    const holdingsPanelPortletResponse = await agent
      .get(holdingsPanelUrl)
      .set(holdingsPanelHeader)
      .timeout(20000)
    const js = await xml2js.parseStringPromise(
      holdingsPanelPortletResponse.text
    )
    if (!js['ajax-response'] || !js['ajax-response'].component) {
      return common.endResponse(responseHoldings)
    }
    $ = cheerio.load(js['ajax-response'].component[0]._)

    if (
      $(
        '.arena-holding-nof-total, .arena-holding-nof-checked-out, .arena-holding-nof-available-for-loan'
      ).length > 0
    ) {
      $('.arena-holding-child-container').each(function (idx, container) {
        const libName = $(container).find('span.arena-holding-link').text()
        const totalAvailable =
          $(container)
            .find('.arena-holding-nof-total span.arena-value')
            .text() ||
          parseInt(
            $(container)
              .find('td.arena-holding-nof-available-for-loan span.arena-value')
              .text() || 0
          ) +
            parseInt(
              $(container)
                .find('td.arena-holding-nof-checked-out span.arena-value')
                .text() || 0
            )
        const checkedOut = $(container)
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
    $('.arena-holding-hyper-container .arena-holding-container a span').each(
      function (i) {
        if (
          $(this).text().trim() === (service.OrganisationName || service.Name)
        ) {
          currentOrg = i
        }
      }
    )
    if (currentOrg == null) return common.endResponse(responseHoldings)

    const holdingsHeaders = { Accept: 'text/xml', 'Wicket-Ajax': true }
    holdingsHeaders['Wicket-FocusedElementId'] =
      'id__crDetailWicket__WAR__arenaportlets____2a'
    let resourceId =
      '/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel:content:holdingsView:' +
      (currentOrg + 1) +
      ':holdingContainer:togglableLink::IBehaviorListener:0:'
    const holdingsUrl =
      service.Url +
      HOLDINGSDETAIL_URL_PORTLETS.replace('[RESOURCEID]', resourceId)
    const holdingsResponse = await agent
      .get(holdingsUrl)
      .set(holdingsHeaders)
      .timeout(20000)
    const holdingsJs = await xml2js.parseStringPromise(holdingsResponse.text)
    $ = cheerio.load(holdingsJs['ajax-response'].component[0]._)

    const libsData = $('.arena-holding-container')
    const numLibs = libsData.length
    if (!numLibs || numLibs === 0) return common.endResponse(responseHoldings)

    const availabilityRequests = []
    libsData.each(function (i) {
      resourceId =
        '/crDetailWicket/?wicket:interface=:0:recordPanel:holdingsPanel:content:holdingsView:' +
        (currentOrg + 1) +
        ':childContainer:childView:' +
        i +
        ':holdingPanel:holdingContainer:togglableLink::IBehaviorListener:0:'
      const libUrl =
        service.Url +
        HOLDINGSDETAIL_URL_PORTLETS.replace('[RESOURCEID]', resourceId)
      const headers = { Accept: 'text/xml', 'Wicket-Ajax': true }
      availabilityRequests.push(agent.get(libUrl).set(headers).timeout(20000))
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
