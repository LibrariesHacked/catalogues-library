/* eslint-env jest */
import * as index from '../index.js'

test('Search OpenLibrary by Author', async () => {
  const results = await index.openLibrarySearch('J.K. Rowling', 'author')
  expect(results.books).not.toHaveLength(0)
  expect(results.books[0].author).toContain('J. K. Rowling')
})

test('Search OpenLibrary by Title', async () => {
  const results = await index.openLibrarySearch('Harry Potter', 'title')
  expect(results.books).not.toHaveLength(0)
  expect(results.books[0].title).toContain('Harry Potter')
})