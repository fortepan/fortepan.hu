const inlineSVG = require("./plugins/inlineSVG")

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/images")
  eleventyConfig.addPassthroughCopy({ "src/static": "/" })
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
