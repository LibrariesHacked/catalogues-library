const request = require('superagent')
const common = require('./common')

console.log('blackpool connector loading...')

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
  const responseLibraries = common.initialiseGetLibrariesResponse(service)
  return common.endResponse(responseLibraries)
}

/**
 * Retrieves the availability summary of an ISBN by library
 * @param {string} isbn
 * @param {object} service
 */
exports.searchByISBN = async function (isbn, service) {
  const agent = request.agent()
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url

  const isbnSearch = `https://api.blackpool.gov.uk/live/api/library/standard/catalogsearchrest/?Term1=${isbn}&Term2=&SearchType=General&HitsToDisplay=5&LibraryFilter=&LanguageFilter=&ItemTypeFilter=&ExactMatch=false&Token=`

  let item = {}
  try {
    const isbnRequest = await agent.get(isbnSearch).timeout(30000)
    if (isbnRequest?.body?.hitlistTitleInfoField && isbnRequest.body.hitlistTitleInfoField.length > 0) {
      item = isbnRequest.body.hitlistTitleInfoField[0]
    } else {
      return common.endResponse(responseHoldings)
    }
  } catch (e) {
    return common.endResponse(responseHoldings)
  }

  const titleId = item?.titleIDField
  if (!titleId) return common.endResponse(responseHoldings)

  try {
    const titleSearch = `https://api.blackpool.gov.uk/live/api/library/standard/lookupTitleInformation/${titleId}`
    const titleRequest = await agent.get(titleSearch).timeout(30000)
    if (!titleRequest?.body?.callInfoField) return common.endResponse(responseHoldings)
    titleRequest.body.callInfoField.forEach(info => {
      const lib = service.Libraries.find(l => l[0] === info.libraryIDField)
      const copiesAvailable = info.itemInfoField.filter(i => i.homeLocationIDField === i.currentLocationIDField)
      const copiesUnavailable = info.itemInfoField.filter(i => i.homeLocationIDField !== i.currentLocationIDField)
      responseHoldings.availability.push({ library: lib[1], available: copiesAvailable.length, unavailable: copiesUnavailable.length })
    })
  } catch (e) {
    return common.endResponse(responseHoldings)
  }

  return common.endResponse(responseHoldings)
}
