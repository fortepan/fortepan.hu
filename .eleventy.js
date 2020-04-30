const inlineSVG = require("./plugins/inlineSVG")

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/images")
  eleventyConfig.addPassthroughCopy({ "src/static": "/" })
  eleventyConfig.addPassthroughCopy({ "node_modules/@webcomponents/webcomponentsjs": "/webcomponents-polyfill" })
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.addLiquidTag("inlineSVG", inlineSVG)

  return {
    dir: {
      input: "src",
      output: "_dist",
      data: "data",
      layouts: "layouts",
      includes: "components",
    },
    passthroughFileCopy: true,
    templateFormats: ["liquid", "md", "html", "yml"],
    htmlTemplateEngine: "liquid",
  }
}
