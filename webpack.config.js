const path = require('path')
const webpack = require('webpack')

const DIST_PATH = path.join(__dirname, 'dist')
const SRC_PATH = path.join(__dirname, 'src')

const PROD = process.env.NODE_ENV === 'production'

const opts = {
  hmr: !PROD,
  minify: PROD,
  env: JSON.stringify(process.env.NODE_ENV),
  dev: JSON.stringify(!PROD)
}
module.exports = {
  devtool: 'source-map',
  cache: 'true',
  entry: {
    main: (!opts.hmr ? [] : [
      'webpack-dev-server/client?http://localhost:8090',
      'webpack/hot/dev-server',
    ]).concat(`${SRC_PATH}/main.js`),
    levdev: (!opts.hmr ? [] : [
      'webpack-dev-server/client?http://localhost:8090',
      'webpack/hot/dev-server',
    ]).concat( `${SRC_PATH}/levdev/main.js`)
  },
  output: {
    path: DIST_PATH,
    filename: '[name].js'
  },
  target: 'web',
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      __DEV__: opts.dev,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: opts.env
      }
    })
  ],
  node: {
    fs: 'empty'
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        include: path.join(__dirname, 'node_modules', 'pixi.js'),
        loader: 'json'
      },
      { test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      { test: /\.scss$/,
        loaders: ['style', 'css', 'sass?outputStyle=expanded']
      }
    ]
  }
}
