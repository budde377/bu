const path = require('path')

module.exports = {
  entry: {
    main: ['babel-polyfill', 'react-hot-loader/patch', './src/client.js']
  },
  plugins: [
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist', 'client'),
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
        test: /\.graphql$/,
        loader: 'graphql-tag/loader'
      },
      {
        test: /\.(svg|woff|woff2|png|eot|ttf)$/,
        loader: 'file-loader'
      }
    ]
  }
}
