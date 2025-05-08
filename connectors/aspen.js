const cheerio = require('cheerio')
const request = require('superagent')

const common = require('./common')

const ADVANCED_SEARCH_URL =
  'Union/Search?view=list&lookfor=&searchIndex=advanced&searchSource=local'

/**
 * Gets the object representing the service
 * @param {object} service
 */
exports.getService = service => common.getService(service)

/**
 * Gets the libraries in the service based upon possible search and filters within the library catalogue
 * @param {object} service
 */
exports.getLibraries = async function (service) {
  const responseLibraries = common.initialiseGetLibrariesResponse(service)

  try {
    const agent = request.agent()
    const url = service.Url + ADVANCED_SEARCH_URL

    // Get the content of the page
    const res = await agent.get(url)

    const $ = cheerio.load(res.text)
    const libraries = []

    // The library dropdown elements all include a value that contains 'owning_location:'
    $('option').each((i, el) => {
      if (!$(el).val().includes('owning_location:')) return

      const library = $(el).text().trim()

      // Add the library to the array
      libraries.push(library)
    })

    responseLibraries.libraries = libraries
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
  responseHoldings.url = service.Url

  try {
    const agent = request.agent()
  } catch (e) {
    responseHoldings.exception = e
  }

  return common.endResponse(responseHoldings)
}
