module.exports = {
  resolve: {
    aliasFields: ['browser', 'browser.esm'],
    fallback: {
      buffer: require.resolve("buffer/"),
      util: require.resolve("util/"),
      https: require.resolve("https-browserify")
    }
  }
}