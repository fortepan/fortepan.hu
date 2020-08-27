const inlineSVG = require("./plugins/inlineSVG")

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/images")
  eleventyConfig.addPassthroughCopy({ "src/static": "/" })
  eleventyConfig.addPassthroughCopy({ admin: "/admin/" })
  eleventyConfig.addPassthroughCopy({ "node_modules/@webcomponents/webcomponentsjs": "/webcomponents-polyfill" })
  eleventyConfig.setUseGitIgnore(false)

  eleventyConfig.addLiquidTag("inlineSVG", inlineSVG)
  eleventyConfig.addLiquidShortcode("now", () => {
    return Date.now()
  })
  eleventyConfig.addLiquidShortcode("date", (timestamp, locale) => {
    const dateFormat = new Intl.DateTimeFormat(locale == "hu" ? "hu-HU" : "en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    return dateFormat.format(new Date(parseInt(timestamp)))
  })

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
