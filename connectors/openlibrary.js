import request from 'superagent'

const URL = 'https://openlibrary.org/search.json'

export const search = async (query, type = 'q') => {
  const agent = request.agent()
  const responseData = { books: [] }

  try {
    // Allows searching by general query (q), title (title), or author (author)
    const searchRequest = await agent
      .get(URL)
      .query({ [type]: query })
      .timeout(2000);

    searchRequest.body.docs.forEach((b) => {
      responseData.books.push({
        title: b.title,
        author: b.author_name ? b.author_name : ['Unknown'],
        isbn: b.isbn ? b.isbn : [],
        first_publish_year: b.first_publish_year
      })
    })
  } catch (e) {
    responseData.error = e.message;
  }

  return responseData
}