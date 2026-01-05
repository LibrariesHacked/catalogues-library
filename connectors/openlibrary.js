import request from 'superagent'

const URL = 'https://openlibrary.org/search.json?q='

export const search = async query => {
  const agent = request.agent()
  const responseData = { books: [] }

  try {
    const searchRequest = await agent.get(URL + query).timeout(1000)
    searchRequest.body.docs.forEach((b, a) => {
      responseData.books.push({
        title: b.title,
        author: b.author_name,
        isbn: b.isbn
      })
    })
  } catch (e) {}

  return responseData
}
