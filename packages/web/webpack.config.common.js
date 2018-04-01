const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    config: './src/window-config.js',
    main: ['babel-polyfill', 'react-hot-loader/patch', './src/index.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Thang.io',
      chunksSortMode: 'manual',
      chunks: ['config', 'main']
    })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          plugins: [
            'transform-class-properties',
            'react-hot-loader/babel'
          ],
          presets: [
            'react',
            'flow',
            'stage-0',
            [
              'env',
              {
                targets: {
                  browsers: ['last 2 versions', 'safari >= 7']
                }
              }
            ]
          ]
        }
      },
      {
        test: /\.(svg|woff|woff2|png|eot|ttf)$/,
        loader: 'file-loader?name=themes/default/assets/fonts/[name].[ext]'
      }
    ]
  }
}
