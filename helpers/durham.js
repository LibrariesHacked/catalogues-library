import * as cheerio from 'cheerio'
import querystring from 'querystring'
import { v4 as uuidv4 } from 'uuid'

import * as common from './common.js'
import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { TIMEOUTS } from './config.js'

export const loginUrl = service =>
  service.Url + 'pgLogin.aspx?CheckJavascript=1&AspxAutoDetectCookieSupport=1'

export const librariesUrl = service => service.Url + 'pgLib.aspx'

export const keywordSearchUrl = service => service.Url + 'pgCatKeywordSearch.aspx'

export const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' }

export const createAgent = (serviceType = 'durham') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const parsePage = html => cheerio.load(html)

export const randomRequestId = () => uuidv4()

export const startSession = async (serviceType, service) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    await agent.get(service.Url).timeout(TIMEOUTS.DEFAULT)
    await agent.post(loginUrl(service)).timeout(TIMEOUTS.DEFAULT)
  })
}

export const fetchLibrariesPage = async (serviceType, service) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.get(librariesUrl(service)).timeout(TIMEOUTS.DEFAULT)
  })
}

export const librariesFromPage = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('ol.list-unstyled li a').each((i, tag) => libraries.push($(tag).text()))
  return libraries
}

export const openKeywordSearchPage = async (serviceType, service) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent.post(keywordSearchUrl(service)).timeout(TIMEOUTS.DEFAULT)
  })
}

export const submitKeywordSearch = async (serviceType, service, form) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent
      .post(keywordSearchUrl(service))
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const hasResultTitle = html =>
  cheerio.load(html)('#cph1_cph2_lvResults_lnkbtnTitle_0').length > 0

export const resultPageUrlFromResponse = response => response.redirects[0]

export const openFirstItemPage = async (serviceType, resultPageUrl, form) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent
      .post(resultPageUrl)
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const itemPageUrl = (itemPageResponse, fallbackUrl) =>
  itemPageResponse.redirects.length > 0 ? itemPageResponse.redirects[0] : fallbackUrl

export const openAvailabilityPage = async (serviceType, pageUrl, form) => {
  return agentManager.executeRequest(serviceType, async (agent) => {
    return agent
      .post(pageUrl)
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const availabilityFromPage = html => {
  const $ = cheerio.load(html)
  const libs = {}
  const availability = []

  $('#cph1_ucItem_lvTitle2_lvLocation_0_itemPlaceholderContainer_0 table tr')
    .slice(1)
    .each(function () {
      const name = $(this).find('td').eq(0).text().trim()
      const status = $(this).find('td').eq(1).text().trim()
      common.tallyLibraryAvailability(libs, name, status !== 'Yes')
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

export const librariesForm = (html, isbn) => {
  const $ = cheerio.load(html)
  return {
    __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
    __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
    __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
    ctl00$ctl00$cph1$cph2$cbBooks: 'on',
    ctl00$ctl00$cph1$cph2$Keywords: isbn,
    ctl00$ctl00$cph1$cph2$btSearch: 'Search'
  }
}

export const resultForm = html => {
  const $ = cheerio.load(html)
  return {
    __EVENTARGUMENT: '',
    __EVENTTARGET: 'ctl00$ctl00$cph1$cph2$lvResults$ctrl0$lnkbtnTitle',
    __LASTFOCUS: '',
    __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
    __VIEWSTATEENCRYPTED: '',
    __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
    ctl00$ctl00$cph1$cph2$lvResults$DataPagerEx2$ctl00$ctl00: 10
  }
}

export const availabilityForm = html => {
  const $ = cheerio.load(html)
  return {
    __EVENTARGUMENT: '',
    __EVENTTARGET: '',
    __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
    __LASTFOCUS: '',
    __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
    __VIEWSTATEENCRYPTED: '',
    __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
    ctl00$ctl00$cph1$cph2$lvResults$DataPagerEx2$ctl00$ctl00: 10,
    ctl00$ctl00$ucItem$lvTitle$ctrl0$btLibraryList: 'Libraries'
  }
}

export const getLibraries = async service => {
  const agent = createAgent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    await startSession(agent, service)
    const librariesPage = await fetchLibrariesPage(agent, service)
    responseLibraries.libraries = librariesFromPage(librariesPage.text)
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.id = uuidv4()

  try {
    const agent = createAgent()

    await startSession(agent, service)
    const cataloguePage = await openKeywordSearchPage(agent, service)
    let $ = cheerio.load(cataloguePage.text)

    const resultPage = await submitKeywordSearch(agent, service, librariesForm({ $, isbn }))
    if (!hasResultTitle(resultPage.text)) { return common.endResponse(responseHoldings) }

    $ = cheerio.load(resultPage.text)
    const resultPageUrl = resultPageUrlFromResponse(resultPage)

    const itemPage = await openFirstItemPage(agent, resultPageUrl, resultForm($))
    $ = cheerio.load(itemPage.text)

    const detailsPageUrl = itemPageUrl(itemPage, resultPageUrl)

    const availabilityPage = await openAvailabilityPage(
      agent,
      detailsPageUrl,
      availabilityForm($)
    )
    responseHoldings.availability = availabilityFromPage(availabilityPage.text)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
