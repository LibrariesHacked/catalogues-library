const cheerio = require('cheerio')
const request = require('superagent')

const common = require('./common')

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = service => common.getService(service)

const getBlackpoolLibrariesInternal = async function (service) {
  const agent = request.agent()
  const response = {
    libraries: []
  }

  try {
    const libraries = await agent.get(service.Url).timeout(20000)

    // HTML is malformed. Grab a sub-section using a regex.
    const select = /\<select id="library-ddl"[\s\S]+?<\/select>/gm.exec(
      libraries.text
    )[0]

    const $ = cheerio.load(select)
    $('#library-ddl')
      .find('option')
      .each((i, option) => {
        if (common.isLibrary($(option).text().trim())) {
          response.libraries.push({
            name: $(option).text().trim(),
            code: $(option).attr('value')
          })
        }
      })
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
  const libs = await getBlackpoolLibrariesInternal(service)

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
  responseHoldings.url = service.Url

  try {
    const agent = request.agent()
    const isbnSearch = `https://api.blackpool.gov.uk/live/api/library/standard/catalogsearchrest/?Term1=${isbn}&Term2=&SearchType=General&HitsToDisplay=5&LibraryFilter=&LanguageFilter=&ItemTypeFilter=&ExactMatch=false&Token=`

    let item = {}
    const isbnRequest = await agent.get(isbnSearch).timeout(30000)
    if (
      isbnRequest?.body?.hitlistTitleInfoField &&
      isbnRequest.body.hitlistTitleInfoField.length > 0
    ) {
      item = isbnRequest.body.hitlistTitleInfoField[0]
    } else {
      return common.endResponse(responseHoldings)
    }

    const titleId = item?.titleIDField
    if (!titleId) return common.endResponse(responseHoldings)

    responseHoldings.id = `${titleId}`

    const libs = await getBlackpoolLibrariesInternal(service)

    const titleSearch = `https://api.blackpool.gov.uk/live/api/library/standard/lookupTitleInformation/${titleId}`
    const titleRequest = await agent.get(titleSearch).timeout(30000)
    if (!titleRequest?.body?.callInfoField) {
      return common.endResponse(responseHoldings)
    }
    titleRequest.body.callInfoField.forEach(info => {
      const lib = libs.libraries.find(l => l.code === info.libraryIDField)
      const copiesAvailable = info.itemInfoField.filter(
        i => i.homeLocationIDField === i.currentLocationIDField
      )
      const copiesUnavailable = info.itemInfoField.filter(
        i => i.homeLocationIDField !== i.currentLocationIDField
      )
      responseHoldings.availability.push({
        library: lib.name,
        available: copiesAvailable.length,
        unavailable: copiesUnavailable.length
      })
    })
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
