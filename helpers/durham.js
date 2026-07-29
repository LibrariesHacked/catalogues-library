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

export const randomRequestId = () => uuidv4()

export const startSession = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    await agent.get(service.Url).set('User-Agent', userAgent).timeout(TIMEOUTS.DEFAULT)
    await agent.post(loginUrl(service)).set('User-Agent', userAgent).timeout(TIMEOUTS.DEFAULT)
  })
}

export const fetchLibrariesPage = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent.get(librariesUrl(service)).set('User-Agent', userAgent).timeout(TIMEOUTS.DEFAULT)
  })
}

export const librariesFromPage = html => {
  const $ = cheerio.load(html)
  const libraries = []

  $('ol.list-unstyled li a').each((i, tag) => libraries.push($(tag).text()))
  return libraries
}

export const openKeywordSearchPage = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent.post(keywordSearchUrl(service)).set('User-Agent', userAgent).timeout(TIMEOUTS.DEFAULT)
  })
}

export const submitKeywordSearch = async (sessionId, service, form) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .post(keywordSearchUrl(service))
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .set('User-Agent', userAgent)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const hasResultTitle = html =>
  cheerio.load(html)('#cph1_cph2_lvResults_lnkbtnTitle_0').length > 0

export const resultPageUrlFromResponse = response => response.redirects[0]

export const openFirstItemPage = async (sessionId, resultPageUrl, form) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .post(resultPageUrl)
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .set('User-Agent', userAgent)
      .timeout(TIMEOUTS.DEFAULT)
  })
}

export const itemPageUrl = (itemPageResponse, fallbackUrl) =>
  itemPageResponse.redirects.length > 0 ? itemPageResponse.redirects[0] : fallbackUrl

export const openAvailabilityPage = async (sessionId, pageUrl, form) => {
  return agentManager.executeSessionRequest(sessionId, async (agent, userAgent) => {
    return agent
      .post(pageUrl)
      .send(querystring.stringify(form))
      .set(FORM_HEADERS)
      .set('User-Agent', userAgent)
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
    __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
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
    ctl00$ctl00$cph1$ucItem$lvTitle$ctrl0$btLibraryList: 'Libraries'
  }
}
