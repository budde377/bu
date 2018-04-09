const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.config.common')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = function (env) {
  return Merge(CommonConfig, {
    mode: 'production',
    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('production')
        }
      }),
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
            beautify: false
          },
          ie8: false,
          mangle: {
            keep_fnames: true
          },
          compress: {
            keep_fnames: true
          }
        }
      })
    ]
  })
}
