var path = require('path')
var config = require('../config')
var utils = require('./utils')
var webpack = require('webpack')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : config.build.env

function applyConfig (filename, library, src) {
  var webpackConfig = merge(baseWebpackConfig, {
    entry: src,
    module: {
      loaders: utils.styleLoaders({ sourceMap: false, extract: false })
    },
    devtool: false,
    output: {
      library: library,
      libraryTarget: 'umd',
      filename: filename + '.js',
      path: path.resolve(__dirname, '../release')
    },
    vue: {
      loaders: utils.cssLoaders({
        sourceMap: config.build.productionSourceMap,
        extract: true
      })
    },
    plugins: [
      // http://vuejs.github.io/vue-loader/workflow/production.html
      new webpack.DefinePlugin({
        'process.env': env
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      }),
      new webpack.optimize.OccurenceOrderPlugin(),
      // extract css into its own file
      new ExtractTextPlugin(filename + '.css')
    ]
  })
  return webpackConfig
}

module.exports = applyConfig
