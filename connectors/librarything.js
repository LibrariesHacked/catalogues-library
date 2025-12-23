import request from 'superagent'
import xml2js from 'xml2js'

const URL = 'https://www.librarything.com/api/thingISBN/'

/**
 * Gets a set of ISBNs relating to a single ISBN from the library thing thingISBN service
 * @param {string} isbn
 */
export const thingISBN = async isbn => {
  const agent = request.agent()
  const responseISBNs = { isbns: [] }

  let isbns = null
  try {
    const isbnRequest = await agent.get(URL + isbn).timeout(1000)
    const isbnJs = await xml2js.parseStringPromise(isbnRequest.text)
    isbns = isbnJs.idlist.isbn
  } catch (e) {}

  if (isbns) isbns.forEach(item => responseISBNs.isbns.push(item))

  return responseISBNs
}
