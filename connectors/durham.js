const request = require('superagent')
const cheerio = require('cheerio')
const querystring = require('querystring')
const common = require('../connectors/common')
const uuid = require('uuid');

console.log('durham connector loading...')

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = (service) => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const agent = request.agent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    await agent.get(service.Url).timeout(20000)
    await agent.post(service.Url + 'pgLogin.aspx?CheckJavascript=1&AspxAutoDetectCookieSupport=1').timeout(20000)
    const libraries = await agent.get(service.Url + 'pgLib.aspx').timeout(20000)
    const $ = cheerio.load(libraries.text)
    $('ol.list-unstyled li a').each((i, tag) => responseLibraries.libraries.push($(tag).text()))
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
  responseHoldings.id = uuid.v4()

  try {
    const agent = request.agent()

    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    await agent.get(service.Url).timeout(20000)
    await agent.post(service.Url + 'pgLogin.aspx?CheckJavascript=1').timeout(20000)
    const cataloguePage = await agent.post(service.Url + 'pgCatKeywordSearch.aspx').timeout(20000)
    let $ = cheerio.load(cataloguePage.text)

    let aspNetForm = {
      __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
      __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
      __EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
      ctl00$ctl00$cph1$cph2$cbBooks: 'on',
      ctl00$ctl00$cph1$cph2$Keywords: isbn,
      ctl00$ctl00$cph1$cph2$btSearch: 'Search'
    }

    const resultPage = await agent.post(service.Url + 'pgCatKeywordSearch.aspx').send(querystring.stringify(aspNetForm)).set(headers).timeout(20000)
    $ = cheerio.load(resultPage.text)
    let resultPageUrl = resultPage.redirects[0]

    if ($('#cph1_cph2_lvResults_lnkbtnTitle_0').length === 0) return common.endResponse(responseHoldings)
    aspNetForm = {
      __EVENTARGUMENT: '',
      __EVENTTARGET: 'ctl00$ctl00$cph1$cph2$lvResults$ctrl0$lnkbtnTitle',
      __LASTFOCUS: '',
      __VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
      __VIEWSTATEENCRYPTED: '',
      __VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
      ctl00$ctl00$cph1$cph2$lvResults$DataPagerEx2$ctl00$ctl00: 10
    }

    const itemPage = await agent.post(resultPageUrl).send(querystring.stringify(aspNetForm)).set(headers).timeout(20000)
    $ = cheerio.load(itemPage.text)

    let itemPageUrl = itemPage.redirects.length > 0 ? itemPage.redirects[0] : resultPageUrl

    aspNetForm = {
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

    const availabilityPage = await agent.post(itemPageUrl).send(querystring.stringify(aspNetForm)).set(headers).timeout(20000)
    $ = cheerio.load(availabilityPage.text)

    const libs = {}
    $('#cph1_ucItem_lvTitle2_lvLocation_0_itemPlaceholderContainer_0 table tr').slice(1).each(function () {
      const name = $(this).find('td').eq(0).text().trim()
      const status = $(this).find('td').eq(1).text().trim()
      if (!libs[name]) { libs[name] = { available: 0, unavailable: 0 } }
      (status !== 'Yes' ? libs[name].available++ : libs[name].unavailable++)
    })
    for (var l in libs) responseHoldings.availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })
  }
  catch(e) {
    responseHoldings.exception = e
  }
  
  return common.endResponse(responseHoldings)
}
