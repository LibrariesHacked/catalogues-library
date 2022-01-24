const request = require('superagent')
const cheerio = require('cheerio')
const common = require('../connectors/common')

console.log('ibistro connector loading...')

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

  const homePage = await agent.get(service.Url + service.Home).timeout(60000)
  const $ = cheerio.load(homePage.text)
  $('#library option').each((idx, option) => {
    if (common.isLibrary($(option).text())) responseLibraries.libraries.push($(option).text())
  })
  return common.endResponse(responseLibraries)
}

/**
 * Retrieves the availability summary of an ISBN by library
 * @param {string} isbn
 * @param {object} service
 */
exports.searchByISBN = async function (isbn, service) {
  const responseHoldings = common.initialiseSearchByISBNResponse(service)
  responseHoldings.url = service.Url + service.Search + isbn

  try {
    const agent = request.agent()

    const searchPageRequest = await agent.get(responseHoldings.url).timeout(30000)
    let itemPage = searchPageRequest.text
  
    let $ = cheerio.load(itemPage)
  
    var re = /put_keepremove_button\('(?<id>[0-9]+)'/.exec(itemPage)
    if (re.length > 1)
      responseHoldings.id = re[1]
  
    if ($('form[name=hitlist]').length > 0) {
      const itemUrl = service.Url + $('form[name=hitlist]').attr('action')
      const itemPageRequest = agent.post(itemUrl).send('first_hit=1&form_type=&last_hit=2&VIEW%5E1=Details').timeout(30000)
      $ = cheerio.load(itemPageRequest.text)
    }
  
    var libs = {}
    var currentLib = ''
    $('tr').each((idx, tr) => {
      var libr = $(tr).find('td.holdingsheader,th.holdingsheader').eq(0).text().trim()
      if (libr === 'Copies') libr = $(tr).find('.holdingsheader_users_library').eq(0).text().trim()
      var status = $(tr).find('td').eq(3).text().trim()
      if (libr) currentLib = libr
      if (!libr && status) {
        if (!libs[currentLib]) libs[currentLib] = { available: 0, unavailable: 0 }
        service.Available.indexOf(status) > -1 ? libs[currentLib].available++ : libs[currentLib].unavailable++
      }
    })
    for (var l in libs) responseHoldings.availability.push({ library: l, available: libs[l].available, unavailable: libs[l].unavailable })
  }
  catch(e) {
    responseHoldings.exception = e
  }
  
  return common.endResponse(responseHoldings)
}
