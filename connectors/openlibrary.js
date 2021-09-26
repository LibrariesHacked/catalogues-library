const request = require('superagent')

console.log('open library connector loading...')

const URL = 'https://openlibrary.org/search.json?q='

exports.search = async (query) => {
  const agent = request.agent()
  const responseData = { books: [] }

  try {
    const searchRequest = await agent.get(URL + query).timeout(1000)
    searchRequest.body.docs.forEach((b, a) => { responseData.books.push({ title: b.title, author: b.author_name, isbn: b.isbn }) })
  } catch (e) { }

  return responseData
}
