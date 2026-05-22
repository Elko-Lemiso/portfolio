'use strict';
const path = require('path');

// Builds bundle usable inside <script>.
module.exports = {
  context: __dirname,
  mode: 'production',
  entry: {
    'app': './src/app.js'
  },
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "[name].js",
    libraryTarget: "umd",
    library: "app",
    clean: true, // Clean dist folder before each build
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        }
      }
    ]
  },
  resolve: {
    fallback: {
      util: require.resolve('util/')
    }
  },
  devServer: {
    contentBase: __dirname,
    publicPath: '/dist',
    compress: true,
    port: 4200,
  },
  optimization: {
    minimize: true,
    minimizer: [
      // Use webpack's built-in TerserPlugin (no need to require separately)
      '...',
    ],
    // Split chunks for better caching
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Separate common code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // Keep module IDs stable for better caching
    moduleIds: 'deterministic',
    // Tree shaking - remove unused exports
    usedExports: true,
    // Concatenate modules for better performance
    concatenateModules: true,
    // Remove empty chunks
    removeEmptyChunks: true,
    // Merge duplicate chunks
    mergeDuplicateChunks: true,
  },
  performance: {
    // Warn if bundle size exceeds limits
    hints: 'warning',
    maxEntrypointSize: 200000, // 200 KB
    maxAssetSize: 200000, // 200 KB
  },
};
