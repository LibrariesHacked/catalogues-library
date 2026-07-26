import request from 'superagent'

import { TIMEOUTS } from './config.js'

export const URL = 'https://openlibrary.org/search.json'

export const search = async (query, type = 'q') => {
  const agent = request.agent()
  const responseData = { books: [] }

  try {
    const searchRequest = await agent
      .get(URL)
      .query({ [type]: query })
      .timeout(TIMEOUTS.MEDIUM)

    searchRequest.body.docs.forEach(b => {
      responseData.books.push({
        title: b.title,
        author: b.author_name ? b.author_name : ['Unknown'],
        isbn: b.isbn ? b.isbn : [],
        first_publish_year: b.first_publish_year
      })
    })
  } catch (e) {
    responseData.error = e.message
  }

  return responseData
}
