// Description: Main entry point for the catalogue library service

const async = require('async')

const syswidecas = require('@small-tech/syswide-cas')
// Intermediate certificate that's often incomplete in SSL chains.
syswidecas.addCAs('./SectigoRSADomainValidationSecureServerCA.cer')

// Catalogue integration connectors
const arenav6 = require('./connectors/arena.v6')
const arenav7 = require('./connectors/arena.v7')
const arenav8 = require('./connectors/arena.v8')
const aspen = require('./connectors/aspen')
const durham = require('./connectors/durham')
const enterprise = require('./connectors/enterprise')
const iguana = require('./connectors/iguana')
const kohav20 = require('./connectors/koha.v20')
const kohav22 = require('./connectors/koha.v22')
const kohav23 = require('./connectors/koha.v23')
const luci = require('./connectors/luci')
const prism3 = require('./connectors/prism3')
const spydus = require('./connectors/spydus')
const webpac = require('./connectors/webpac')

// Other service connectors
const libThing = require('./connectors/librarything')
const openLibrary = require('./connectors/openlibrary')

// Our data file of library services and their catalogue integrations
const data = require('./data/data.json')

const serviceFunctions = {
  arenav6,
  arenav7,
  arenav8,
  aspen,
  durham,
  enterprise,
  iguana,
  kohav20,
  kohav22,
  kohav23,
  luci,
  prism3,
  spydus,
  webpac
}

const getServiceFunction = service => {
  return serviceFunctions[service.Type + (service.Version || '')]
}

const getLibraryServicesFromFilter = serviceFilter => {
  return data.LibraryServices.filter(service => {
    return (
      service.Type !== '' &&
      (!serviceFilter ||
        service.Name === serviceFilter ||
        service.Code === serviceFilter)
    )
  })
}

/**
 * Gets library service data
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} serviceResults An array of library services
 */
exports.services = async serviceFilter => {
  const services = getLibraryServicesFromFilter(serviceFilter).map(service => {
    return async () => {
      return getServiceFunction(service).getService(service)
    }
  })

  const serviceResults = await async.parallel(services)
  return serviceResults
}

/**
 * Gets individual library service point data
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} libraryServicePoints An array of library service points
 */
exports.libraries = async serviceFilter => {
  const searches = data.LibraryServices.filter(service => {
    return (
      service.Type !== '' &&
      (!serviceFilter ||
        service.Name === serviceFilter ||
        service.Code === serviceFilter)
    )
  }).map(service => {
    return async () => {
      const resp = await getServiceFunction(service).getLibraries(service)
      return resp
    }
  })

  const libraryServicePoints = await async.parallel(searches)
  return libraryServicePoints
}

/**
 * Gets ISBN availability information for library service points
 * @param {String} isbn The ISBN to search for
 * @param {String} serviceFilter An optional service to filter by using either code or name
 * @param {Object[]} availability The availability of the ISBN by service
 */
exports.availability = async (isbn, serviceFilter) => {
  const searches = data.LibraryServices.filter(service => {
    return (
      service.Type !== '' &&
      (!serviceFilter ||
        service.Name === serviceFilter ||
        service.Code === serviceFilter)
    )
  }).map(service => {
    return async () => {
      const resp = await getServiceFunction(service).searchByISBN(isbn, service)
      return resp
    }
  })

  const availability = await async.parallel(searches)
  return availability
}

/**
 * Gets results from the LibraryThing ISBN service
 * @param {String} isbn The ISBN to search for
 * @param {String[]} isbnsAn array of ISBNs
 */
exports.thingISBN = async isbn => {
  const thingData = await libThing.thingISBN(isbn)
  return thingData.isbns
}

/**
 * Gets results from open libraries free text search
 * @param {String} query The query to search with
 * @param {Object} openLibData The search response from open library
 */
exports.openLibrarySearch = async query => {
  const openLibData = await openLibrary.search(query)
  return openLibData
}
