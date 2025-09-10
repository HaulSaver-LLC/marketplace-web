// webpack/webpack.common.js
module.exports = {
  // ...
  module: {
    rules: [
      // other rules...

      // Only parse sourcemaps for our app code, not dependencies
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules/, // ⬅️ crucial line
      },

      // other rules...
    ],
  },
  // Optional: quiet the warnings
  ignoreWarnings: [/Failed to parse source map/, /source-map-loader/],
};
