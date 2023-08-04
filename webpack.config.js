const { WebpackManifestPlugin } = require("webpack-manifest-plugin")
const path = require("path")

// Code optimizers
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
  mode: process.env.ENV || "development",
  context: path.join(__dirname, "src"),
  entry: "./site.js",
  output: {
    library: "SITE",
    path: path.resolve(__dirname, "_dist", "js"),
    filename: process.env.ENV === "production" ? "[name].[contenthash].js" : "[name].js",
  },
  devtool: "source-map",
  optimization: {
    minimizer:
      process.env.ENV === "production"
        ? [
            new TerserPlugin({
              exclude: /[\\/]node_modules[\\/]/,
              extractComments: false,
            }),
          ]
        : [],
  },
  plugins: [
    new WebpackManifestPlugin({
      publicPath: "js/",
      fileName: path.resolve(__dirname, "src/data", "manifest-js.json"),
    }),
  ],
}