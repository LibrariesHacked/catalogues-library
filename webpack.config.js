var path = require('path')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname) + '/index.js',
  plugins: [
    new NodePolyfillPlugin()
  ]
}