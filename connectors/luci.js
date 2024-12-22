const request = require('superagent')

const common = require('./common')

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = service => common.getService(service)

const getLuciLibrariesInternal = async function (service) {
  const agent = request.agent()
  const response = {
    libraries: []
  }

  try {
    let resp = await agent.get(`${service.Url}${service.Home}`).timeout(20000)
    const frontEndId = /\/_next\/static\/([^\/]+)\/_buildManifest.js/gm.exec(
      resp.text
    )[1]

    resp = await agent
      .get(`${service.Url}_next/data/${frontEndId}/user/register.json`)
      .timeout(20000)
    const libraries = resp.body.pageProps.patronFields.find(
      x => x.code === 'patron_homeLocation'
    ).optionList

    for (const library of libraries) {
      response.libraries.push({
        name: library.value.trim(),
        code: library.key.trim()
      })
    }
  } catch (e) {
    response.exception = e
  }

  return response
}

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)
  const libs = await getLuciLibrariesInternal(service)

  responseLibraries.exception = libs.exception
  responseLibraries.libraries = libs.libraries.map(x => x.name)

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
    let resp = await agent.get(`${service.Url}${service.Home}`).timeout(20000)

    const appId = /\?appid=([a-f0-9\-]+)/gm.exec(resp.text)[1]

    resp = await agent
      .post(`${service.Url}api/manifestations/searchresult`)
      .send({
        searchTerm: isbn,
        searchTarget: '',
        searchField: '',
        sortField: 'any',
        searchLimit: '196',
        offset: 0,
        facets: [
          {
            Name: 'LANGUAGE',
            Selected: ['ENG']
          }
        ],
        count: 40
      })
      .set('Content-Type', 'application/json')
      .set('solus-app-id', appId)
      .timeout(20000)

    const result = resp.body.records.find(x => x.isbnList.includes(isbn))

    if (!result || result.eContent) {
      return common.endResponse(responseHoldings)
    }

    responseHoldings.id = result.recordID
    responseHoldings.url = `${service.Url}manifestations/${result.recordID}`

    resp = await agent
      .get(`${service.Url}api/record?id=${result.recordID}&source=ILSWS`)
      .set('solus-app-id', appId)
      .timeout(20000)

    let libraries = resp.body.data.copies.map(x => x.location.locationName)

    // Get unique library values.
    libraries = libraries.filter((v, i, s) => s.indexOf(v) === i)

    for (const library of libraries) {
      responseHoldings.availability.push({
        library,
        available: resp.body.data.copies.filter(
          x => x.location.locationName === library && x.available
        ).length,
        unavailable: resp.body.data.copies.filter(
          x => x.location.locationName === library && !x.available
        ).length
      })
    }
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
