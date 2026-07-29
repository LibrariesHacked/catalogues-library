import { TIMEOUTS, RATE_LIMITS } from './config.js'
import { agentManager } from './agent-manager.js'

export { TIMEOUTS } from './config.js'

export const createAgent = (serviceType = 'luci') => {
  if (RATE_LIMITS[serviceType]) {
    agentManager.configureRateLimit(serviceType, RATE_LIMITS[serviceType])
  }
  return serviceType
}

export const fetchHomePage = async (sessionId, service) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
    return agent.get(`${service.Url}${service.Home}`).timeout(TIMEOUTS.DEFAULT)
  })
}

export const frontEndIdFromHome = html =>
  /_next\/static\/([^/]+)\/_buildManifest.js/gm.exec(html)[1]

export const fetchRegistrationData = async (sessionId, service, frontEndId) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
    return agent
      .get(`${service.Url}_next/data/${frontEndId}/user/register.json`)
      .timeout(TIMEOUTS.DEFAULT)
  })
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

export const appIdFromHome = html => /\?appid=([a-f0-9-]+)/gm.exec(html)[1]

export const searchManifestations = async (sessionId, service, appId, isbn) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
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
  })
}

export const findManifestationByIsbn = (records, isbn) => {
  return records.find(x => x.isbnList.includes(isbn))
}

export const fetchRecordDetails = async (sessionId, service, appId, recordId) => {
  return agentManager.executeSessionRequest(sessionId, async (agent) => {
    return agent
      .get(`${service.Url}api/record?id=${recordId}&source=ILSWS`)
      .set('solus-app-id', appId)
      .timeout(TIMEOUTS.DEFAULT)
  })
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
