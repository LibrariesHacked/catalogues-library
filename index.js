// Description: Main entry point for the catalogue library service

import async from 'async'

import syswidecas from '@small-tech/syswide-cas'
// Intermediate certificate that's often incomplete in SSL chains.
syswidecas.addCAs('./SectigoRSADomainValidationSecureServerCA.cer')

// Catalogue integration connectors
import * as arena from './connectors/arena.js'
import * as aspen from './connectors/aspen.js'
import * as durham from './connectors/durham.js'
import * as enterprise from './connectors/enterprise.js'
import * as iguana from './connectors/iguana.js'
import * as kohav23 from './connectors/koha.v23.js'
import * as kohav24 from './connectors/koha.v24.js'
import * as luci from './connectors/luci.js'
import * as prism3 from './connectors/prism3.js'
import * as spydus from './connectors/spydus.js'
import * as webpac from './connectors/webpac.js'

// Other service connectors
import * as libThing from './connectors/librarything.js'
import * as openLibrary from './connectors/openlibrary.js'

// Our data file of library services and their catalogue integrations
import data from './data/data.json' with { type: 'json' }

const serviceFunctions = {
  arena,
  aspen,
  durham,
  enterprise,
  iguana,
  kohav23,
  kohav24,
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
export const services = async serviceFilter => {
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
export const libraries = async serviceFilter => {
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
export const availability = async (isbn, serviceFilter) => {
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
export const thingISBN = async isbn => {
  const thingData = await libThing.thingISBN(isbn)
  return thingData.isbns
}

/**
 * Gets results from open libraries free text search
 * @param {String} query The query to search with
 * @param {Object} openLibData The search response from open library
 */
export const openLibrarySearch = async query => {
  const openLibData = await openLibrary.search(query)
  return openLibData
}
