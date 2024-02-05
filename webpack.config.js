const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "production",
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/bundle.js'
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            }
          }
        ]
    },
    {
      test: /\.ts(x)?$/,
      loader: 'ts-loader',
      exclude: /node_modules/
    }
    ]
  },
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/mystyles.css'
    }),
    new CopyPlugin({
        patterns: [
            { from: 'src/sw.js', to: 'js' }, 
            { from: "src/index.html" },
            { from: "src/rowingplayer.json" },
            { from: "src/rowingplayer.svg" },
            { from: "src/solid.min.css", to: "css" },
            { from: "src/fontawesome.min.css", to: "css" },
            { from: "src/webfonts", to: "webfonts" }
        ]
    })
  ]
};