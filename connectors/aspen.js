const cheerio = require('cheerio')
const request = require('superagent')

const common = require('./common')

const ADVANCED_SEARCH_URL =
  'Union/Search?view=list&lookfor=&searchIndex=advanced&searchSource=local'

const SEARCH_RESULTS_URL =
  'Union/Search?view=list&lookfor=[ISBN]&searchIndex=Keyword&searchSource=local'

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
    const url = `${service.Url}${ADVANCED_SEARCH_URL}`

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

  try {
    const agent = request.agent()
    const url = `${service.Url}${SEARCH_RESULTS_URL.replace('[ISBN]', isbn)}`

    const res = await agent.get(url)

    let $ = cheerio.load(res.text)

    // In the results list get the first item
    const firstItem = $('.resultsList').find('a').first()

    // Get the URL for the first item
    const itemId = firstItem.attr('id').replace('record', '')
    responseHoldings.id = itemId

    const itemUrl = `${service.Url}GroupedWork/${itemId}`
    responseHoldings.url = itemUrl

    // We should be able to get a list of available copies from
    // https://libraries.rbkc.gov.uk/GroupedWork/ad09c758-1613-5091-c11c-c35c85aec1f5-eng/AJAX?method=getCopyDetails&format=Book&recordId=ad09c758-1613-5091-c11c-c35c85aec1f5-eng
    const copiesUrl = `${service.Url}GroupedWork/${itemId}/AJAX?method=getCopyDetails&format=Book&recordId=${itemId}`
    const copiesRes = await agent.get(copiesUrl)

    // That returns a JSON object with HTML
    // e.g. { "title": "Where is it?", "modalBody": "<div id=\"itemSummaryPopup_ad09c758-1613-5091-c11c-c35c85aec1f5-eng_Book\" class=\"itemSummaryPopup\"><table class=\"table table-striped table-condensed itemSummaryTable\"><thead><tr><th>Available Copies<\/th><th>Location<\/th><th>Call #<\/th><\/tr><\/thead><tbody><tr class=\"available\" ><td>1 of 10 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Kensington Central Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Kensington Central Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 3 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Kensington Central Library - FAN - Adult lending<\/td><td class=\"notranslate\">FAN<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Brompton Library - F9 - Children's Library<\/td><td class=\"notranslate\">AUTO<\/td><\/tr><tr ><td>0 of 3<\/td><td class=\"notranslate\">Brompton Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr ><td>0 of 3<\/td><td class=\"notranslate\">Chelsea Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Chelsea Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES - OVERSIZE<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Chelsea Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>2 of 4 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Kensal Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 10 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">North Kensington Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Charing Cross Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>3 of 4 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Charing Cross Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 2<\/td><td class=\"notranslate\">Church Street Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 9<\/td><td class=\"notranslate\">Church Street Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 3 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Maida Vale Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Maida Vale Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 11 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Maida Vale Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Marylebone Library - F7 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 4 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Marylebone Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Marylebone Library - FAN - Adult lending<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 3 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Mayfair Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 11<\/td><td class=\"notranslate\">Paddington Children's Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Paddington Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>2 of 2 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Pimlico Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Pimlico Library - F9 - Children's Library<\/td><td class=\"notranslate\">AUTO<\/td><\/tr><tr ><td>0 of 6<\/td><td class=\"notranslate\">Pimlico Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr ><td>0 of 3<\/td><td class=\"notranslate\">Pimlico Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Pimlico Library - FAN - Adult lending<\/td><td class=\"notranslate\">FICTION SF<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Pimlico Library - FICCD - Children's Library<\/td><td class=\"notranslate\">AUTO<\/td><\/tr><tr ><td>0 of 2<\/td><td class=\"notranslate\">Queen's Park Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 7 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Queen's Park Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Queen's Park Library - SCF - Adult lending<\/td><td class=\"notranslate\">FICTION SF<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">St John's Wood Library - F7 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 2 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">St John's Wood Library - F7 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">St John's Wood Library - F9 - Children's Library<\/td><td class=\"notranslate\">STORIES<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">St John's Wood Library - FAN - Adult lending<\/td><td class=\"notranslate\">FICTION SF<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">St John's Wood Library - FAN - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 1<\/td><td class=\"notranslate\">Victoria Library - F7 - ZCHILDRENS<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 3<\/td><td class=\"notranslate\">Victoria Library - F9 - Children's Library<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr ><td>0 of 2<\/td><td class=\"notranslate\">Victoria Library - F9 - ZCHILDRENS<\/td><td class=\"notranslate\">Stories<\/td><\/tr><tr class=\"available\" ><td>1 of 1 <i class=\"fa fa-check\"><\/i><\/td><td class=\"notranslate\">Victoria Library - SCF - Adult lending<\/td><td class=\"notranslate\">FICTION SF<\/td><\/tr><\/tbody><\/table><\/div>"}

    const copiesHtml = JSON.parse(copiesRes.text).modalBody
    $ = cheerio.load(copiesHtml)

    // The HTML is a table with the headers of Available Copies, Location and Call #
    // Available copies is something like 1 of 10
    // Location is the library name
    $('table tbody tr').each((i, tr) => {
      const copiesText = $(tr).find('td').eq(0).text().trim()
      const availableText = copiesText.split(' of ')[0]
      const totalText = copiesText.split(' of ')[1]
      const total = parseInt(totalText)
      const available = parseInt(availableText)
      const unavailable = total - available
      const library = $(tr).find('td').eq(1).text().trim()
      responseHoldings.availability.push({ library, available, unavailable })
    })
  } catch (e) {
    responseHoldings.exception = e
  }
  return common.endResponse(responseHoldings)
}
