import * as cheerio from 'cheerio'
import request from 'superagent'

import * as common from '../connectors/common.js'

const LIBS_URL = 'cgi-bin/spydus.exe/MSGTRN/WPAC/COMB'
const SEARCH_URL = 'cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ?NRECS=1&ISBN='

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
  const agent = request.agent()
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    let libsUrl = service.Url + LIBS_URL
    if (service.OpacReference) {
      libsUrl = libsUrl.replace('WPAC', service.OpacReference)
    }
    if (service.CatalogueReference) {
      libsUrl = libsUrl.replace('COMB', service.CatalogueReference)
    }
    const libsPageRequest = await agent
      .get(libsUrl)
      .set({ Cookie: 'ALLOWCOOKIES_443=1' })
      .timeout(60000)

    const $ = cheerio.load(libsPageRequest.text)
    $('#LOC option').each(function (idx, option) {
      if (common.isLibrary($(option).text().trim()))
        responseLibraries.libraries.push($(option).text().trim())
    })
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
  let holdingsUrl = service.Url + SEARCH_URL + isbn
  if (service.OpacReference) {
    holdingsUrl = holdingsUrl.replace('WPAC', service.OpacReference)
  }

  const agent = request.agent()
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = holdingsUrl

  try {
    const itemPageRequest = await await agent.get(holdingsUrl).timeout(60000)
    let $ = cheerio.load(itemPageRequest.text)
    if ($('#result-content-list').length === 0)
      return common.endResponse(responseHoldings)

    responseHoldings.id = $('.card.card-list').first().find('a').attr('name')

    if (!responseHoldings.id) {
      responseHoldings.id = $('.card.card-list')
        .first()
        .find('input.form-check-input')
        .attr('value')
    }

    const availabilityUrl = $('.card-text.availability')
      .first()
      .find('a')
      .attr('href')
    const availabilityRequest = await agent
      .get(service.Url + availabilityUrl)
      .timeout(60000)

    $ = cheerio.load(availabilityRequest.text)

    const libs = {}
    $('table tr')
      .slice(1)
      .each(function (i, tr) {
        const name = $(tr).find('td').eq(0).text().trim()
        const status = $(tr).find('td').eq(3).text().trim()
        if (!libs[name]) libs[name] = { available: 0, unavailable: 0 }
        status === 'Available'
          ? libs[name].available++
          : libs[name].unavailable++
      })
    for (const l in libs)
      responseHoldings.availability.push({
        library: l,
        available: libs[l].available,
        unavailable: libs[l].unavailable
      })
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
