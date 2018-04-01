const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.config.common')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = function (env) {
  return Merge(CommonConfig, {
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new FaviconsWebpackPlugin('./images/logo_icon.png'),
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css'
      }),
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
