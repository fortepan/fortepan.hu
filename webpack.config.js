const webpack = require("webpack")
const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const Sass = require("sass")
const Fiber = require("fibers") // makes sass faster
const globImporter = require("node-sass-glob-importer")

// Code optimizers
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
  mode: process.env.ENV || "development",
  entry: "./src/site.js",
  output: {
    library: "SITE",
    path: path.resolve(__dirname, "_compiled-assets"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "sass-loader",
            options: {
              implementation: Sass,
              sassOptions: {
                fiber: Fiber,
                outputStyle: "expanded",
                importer: globImporter(),
              },
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimizer:
      process.env.ENV === "production"
        ? [
            new OptimizeCssAssetsPlugin({}),
            new TerserPlugin({
              exclude: /[\\/]node_modules[\\/]/,
              extractComments: false,
            }),
          ]
        : [],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.ENV": JSON.stringify(process.env.ENV || "development"),
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
}
