const path = require('path')
const nodeExternal = require('webpack-node-externals')

module.exports = {
  target: 'node',
  externals: [nodeExternal()], // removes node_modules from your final bundle
  entry: './build/main.js', // make sure this matches the main root of your code
  output: {
    path: path.join(__dirname, 'build'), // this can be any path and directory you want
    filename: 'index.min.js',
  },
  optimization: {
    minimize: true, // enabling this reduces file size and readability
  },
  mode: 'production',
}
