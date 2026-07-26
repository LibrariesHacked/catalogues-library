import * as cheerio from 'cheerio'
import request from 'superagent'

import * as common from './common.js'
import { TIMEOUTS } from './config.js'

export { TIMEOUTS } from './config.js'

export const AVAILABLE_STATUSES = [
  'http://schema.org/InStock',
  'http://schema.org/InStoreOnly'
]
export const HEADER = { 'Content-Type': 'text/xml; charset=utf-8' }
export const DEEP_LINK = 'items?query='

export const getLibraries = async service => {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()
    const advancedSearchPageRequest = await agent
      .get(service.Url + 'advancedsearch?target=catalogue')
      .timeout(TIMEOUTS.EXTRA_LONG)
    const $ = cheerio.load(advancedSearchPageRequest.text)

    $('#locdd option').each((idx, option) => {
      if (common.isLibrary($(option).text().trim())) { responseLibraries.libraries.push($(option).text().trim()) }
    })
  } catch (e) {
    responseLibraries.exception = e
  }

  return common.endResponse(responseLibraries)
}

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url + DEEP_LINK + isbn

  try {
    const agent = request.agent()
    const searchRequest = await agent
      .get(service.Url + 'items.json?query=' + isbn)
      .set(HEADER)
      .timeout(TIMEOUTS.LONG)
    if (searchRequest.body.length === 0) return common.endResponse(responseHoldings)

    let itemUrl = ''

    for (const k of Object.keys(searchRequest.body)) {
      let eBook = true

      if (k.indexOf('/items/') > 0) {
        itemUrl = k

        for (const key of Object.keys(searchRequest.body[k])) {
          const item = searchRequest.body[k][key]
          switch (key) {
            case 'http://purl.org/dc/elements/1.1/format':
              item.forEach(format => {
                if (format.value !== 'eBook') eBook = false
              })
              break
            case 'http://purl.org/dc/terms/identifier':
              responseHoldings.id = item[0].value
              break
          }
        }

        if (itemUrl && eBook) itemUrl = ''
        else break
      }
    }

    if (itemUrl === '') return common.endResponse(responseHoldings)

    const itemRequest = await agent.get(itemUrl).timeout(TIMEOUTS.LONG)
    const $ = cheerio.load(itemRequest.text)

    $('#availability ul.options')
      .find('li')
      .each((idx, li) => {
        const libr = {
          library: $(li).find('h3 span span').text().trim(),
          available: 0,
          unavailable: 0
        }
        $(li)
          .find('div.jsHidden table tbody tr')
          .each((i, tr) => {
            const status = $(tr)
              .find("link[itemprop = 'availability']")
              .attr('href')
            AVAILABLE_STATUSES.includes(status)
              ? libr.available++
              : libr.unavailable++
          })
        responseHoldings.availability.push(libr)
      })
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
