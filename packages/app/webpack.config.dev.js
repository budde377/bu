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
  devServer: {
    proxy: {
      '/': {
        target: `http://localhost:${config.port}`,
        changeOrigin: true
      }
    },
    contentBase: path.join(__dirname, 'dist', 'client'),
    port: config.port + 1,
    host: config.host
  }
})
