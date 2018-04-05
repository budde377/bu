const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  target: 'node',
  devtool: 'source-map',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: [nodeExternals()],
  entry: [
    './src/server.js'
  ],
  output: {
    path: path.join(__dirname, 'dist', 'server'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel-loader']
      },
      {
        test: /\.(svg|woff|woff2|png|eot|ttf)$/,
        loader: 'file-loader',
        options: {
          publicPath: '/',
          emitFile: false
        }
      }
    ]
  }
}
