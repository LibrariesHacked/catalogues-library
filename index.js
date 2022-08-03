const async = require('async')
const data = require('./data/data.json')
const libThing = require('./connectors/librarything')
const openLibrary = require('./connectors/openlibrary')
const syswidecas = require('syswide-cas');

// Intermediate certificate that's often incomplete in SSL chains.
syswidecas.addCAs('./SectigoRSADomainValidationSecureServerCA.cer');

// Loads all the connectors that are currently referenced in data.json
var serviceFunctions = {}
data.LibraryServices.forEach((service) => {
  if (service.Version) {
    if (!serviceFunctions[`${service.Type}_${service.Version}`]) serviceFunctions[`${service.Type}_${service.Version}`] = require(`./connectors/${service.Type}/${service.Version}`);
  }
  else {
    if (!serviceFunctions[service.Type]) serviceFunctions[service.Type] = require('./connectors/' + service.Type);
  }
})

/**
 * Gets library service data
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} serviceResults An array of library services
 */
exports.services = async (serviceFilter) => {
  var services = data.LibraryServices
    .filter((service) => (service.Type !== '' && (!serviceFilter || service.Name === serviceFilter || service.Code === serviceFilter)))
    .map((service) => {
      return async () => {
        return serviceFunctions[service.Type].getService(service)
      }
    })

  var serviceResults = await async.parallel(services)
  return serviceResults
}

/**
 * Gets individual library service point data
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} libraryServicePoints An array of library service points
 */
exports.libraries = async (serviceFilter) => {
  var searches = data.LibraryServices
    .filter((service) => {
      return (service.Type !== '' && (!serviceFilter || service.Name === serviceFilter || service.Code === serviceFilter))
    })
    .map((service) => {
      return async () => {
        var response = await serviceFunctions[service.Version ? `${service.Type}_${service.Version}` : service.Type].getLibraries(service)
        return response
      }
    })

  var libraryServicePoints = await async.parallel(searches)
  return libraryServicePoints
}

/**
 * Gets ISBN availability information for library service points
 * @param {String} isbn The ISBN to search for
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} availability The availability of the ISBN by service
 */
exports.availability = async (isbn, serviceFilter) => {
  var searches = data.LibraryServices
    .filter((service) => {
      return (service.Type !== '' && (!serviceFilter || service.Name === serviceFilter || service.Code === serviceFilter))
    })
    .map((service) => {
      return async () => {
        var response = await serviceFunctions[service.Version ? `${service.Type}_${service.Version}` : service.Type].searchByISBN(isbn, service)
        return response
      }
    })

  var availability = await async.parallel(searches)
  return availability
}

/**
 * Gets results from the library thing thingISBN service
 * @param {String} isbn The ISBN to search for
 * @param {String[]} isbnsAn array of ISBNs
 */
exports.thingISBN = async (isbn) => {
  var thingData = await libThing.thingISBN(isbn)
  return thingData.isbns
}

/**
 * Gets results from open libraries free text search
 * @param {String} query The query to search with
 * @param {Object} openLibData The search response from open library
 */
exports.openLibrarySearch = async (query) => {
  var openLibData = await openLibrary.search(query)
  return openLibData
}