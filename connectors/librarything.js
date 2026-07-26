import { thingISBN as helperThingISBN } from '../helpers/librarything.js'

/**
 * Gets a set of ISBNs relating to a single ISBN from the library thing thingISBN service
 * @param {string} isbn
 */
export const thingISBN = async isbn => {
  const relatedIsbns = await helperThingISBN(isbn)
  return relatedIsbns
}
