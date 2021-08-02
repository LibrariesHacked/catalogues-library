module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      util: require.resolve("util/"),
      https: require.resolve("https-browserify")
    }
  }
}