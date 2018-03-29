const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.config.common')
const path = require('path')
const webpack = require('webpack')
const config = require('config')

module.exports = Merge(CommonConfig, {
  mode: 'development', // Webpack 4 modes
  devtool: 'source-map',
  output: {
    publicPath: '/'
  },
  plugins: [
    new webpack.NamedModulesPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: config.port,
    host: config.host,
    index: 'index.html',
    historyApiFallback: {
      rewrites: [
        {from: '/*', to: '/index.html'}
      ]
    }
  }
})
