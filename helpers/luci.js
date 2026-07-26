import request from 'superagent'

import * as common from './common.js'
import { TIMEOUTS } from './config.js'

export { TIMEOUTS } from './config.js'

export const createAgent = () => request.agent()

export const fetchHomePage = async (agent, service) => {
  return agent.get(`${service.Url}${service.Home}`).timeout(TIMEOUTS.DEFAULT)
}

export const frontEndIdFromHome = html =>
  /_next\/static\/([^/]+)\/_buildManifest.js/gm.exec(html)[1]

export const fetchRegistrationData = async (agent, service, frontEndId) => {
  return agent
    .get(`${service.Url}_next/data/${frontEndId}/user/register.json`)
    .timeout(TIMEOUTS.DEFAULT)
}

export const librariesFromRegistrationData = registrationBody => {
  const libraries = []
  const optionList = registrationBody.pageProps.patronFields.find(
    x => x.code === 'patron_homeLocation'
  ).optionList

  for (const library of optionList) {
    libraries.push({
      name: library.value.trim(),
      code: library.key.trim()
    })
  }

  return libraries
}

export const getLuciLibrariesInternal = async function (service) {
  const agent = createAgent()
  const response = {
    libraries: []
  }

  try {
    const homePage = await fetchHomePage(agent, service)
    const frontEndId = frontEndIdFromHome(homePage.text)
    const registrationData = await fetchRegistrationData(agent, service, frontEndId)
    response.libraries = librariesFromRegistrationData(registrationData.body)
  } catch (e) {
    response.exception = e
  }

  return response
}

export const appIdFromHome = html => /\?appid=([a-f0-9-]+)/gm.exec(html)[1]

export const searchManifestations = async (agent, service, appId, isbn) => {
  return agent
    .post(`${service.Url}api/manifestations/searchresult`)
    .send({
      searchTerm: isbn,
      searchTarget: '',
      searchField: '',
      sortField: 'any',
      searchLimit: '196',
      offset: 0,
      count: 40
    })
    .set('Content-Type', 'application/json')
    .set('solus-app-id', appId)
    .timeout(TIMEOUTS.DEFAULT)
}

export const findManifestationByIsbn = (records, isbn) => {
  return records.find(x => x.isbnList.includes(isbn))
}

export const fetchRecordDetails = async (agent, service, appId, recordId) => {
  return agent
    .get(`${service.Url}api/record?id=${recordId}&source=ILSWS`)
    .set('solus-app-id', appId)
    .timeout(TIMEOUTS.DEFAULT)
}

export const availabilityFromCopies = copies => {
  const availability = []
  let libraries = copies.map(x => x.location.locationName)
  libraries = libraries.filter((v, i, s) => s.indexOf(v) === i)

  for (const library of libraries) {
    availability.push({
      library,
      available: copies.filter(
        x => x.location.locationName === library && x.available
      ).length,
      unavailable: copies.filter(
        x => x.location.locationName === library && !x.available
      ).length
    })
  }

  return availability
}

export const getLibraries = async service => {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)
  const libs = await getLuciLibrariesInternal(service)

  responseLibraries.exception = libs.exception
  responseLibraries.libraries = libs.libraries.map(x => x.name)
  return common.endResponse(responseLibraries)
}

export const getServiceUrl = service => service.Url + service.Home

export const searchByISBN = async (isbn, service) => {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)

  try {
    const agent = createAgent()
    let resp = await fetchHomePage(agent, service)
    const appId = appIdFromHome(resp.text)

    resp = await searchManifestations(agent, service, appId, isbn)
    const result = findManifestationByIsbn(resp.body.records, isbn)

    if (!result || result.eContent) return common.endResponse(responseHoldings)

    responseHoldings.id = result.recordID
    responseHoldings.url = `${service.Url}manifestations/${result.recordID}`

    resp = await fetchRecordDetails(agent, service, appId, result.recordID)
    responseHoldings.availability = availabilityFromCopies(resp.body.data.copies)
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
