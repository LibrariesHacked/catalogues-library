import { search as helperSearch } from '../helpers/openlibrary.js'

export const search = async (query, type = 'q') => {
  // Step 1: Execute OpenLibrary query by selected search field.
  const openLibraryResults = await helperSearch(query, type)

  // Step 2: Return normalised OpenLibrary search results.
  return openLibraryResults
}
