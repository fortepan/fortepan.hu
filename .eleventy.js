const inlineSVG = require("./plugins/inlineSVG")
const htmlmin = require("html-minifier")

module.exports = eleventyConfig => {
  // Disable .gitignore and use eleventy's own ignore file instead
  eleventyConfig.setUseGitIgnore(false)

  // Watch the compiled assets for changes
  eleventyConfig.addWatchTarget("./_compiled-assets/")

  // Copy assets
  eleventyConfig.addPassthroughCopy({ "_compiled-assets": "/" })
  eleventyConfig.addPassthroughCopy({ "src/static/images": "/images/" })
  eleventyConfig.addPassthroughCopy({ "src/static/uploads": "/uploads/" })
  eleventyConfig.addPassthroughCopy({ "src/static/": "/" })
  eleventyConfig.addPassthroughCopy({ "src/data/photo_collections.json": "/photo_collections.json" })
  eleventyConfig.addPassthroughCopy({ "node_modules/@webcomponents/webcomponentsjs": "/webcomponents-polyfill" })

  // Define custom liquid tags and shortcodes
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
  eleventyConfig.addLiquidShortcode("date_iso", (timestamp, full = false) => {
    if (timestamp) {
      const iso = new Date(parseInt(timestamp)).toISOString()
      return full ? iso : iso.split("T")[0].toString()
    }
    return ""
  })

  // Minify html in production
  if (process.env.ENV === "production") {
    eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
      if (outputPath.endsWith(".html")) {
        const minified = htmlmin.minify(content, {
          collapseInlineTagWhitespace: false,
          collapseWhitespace: true,
          removeComments: true,
          sortClassName: true,
          useShortDoctype: true,
        })
        return minified
      }
      return content
    })
  }

  return {
    dir: {
      input: "src",
      output: "_dist",
      data: "data",
      layouts: "layouts",
      includes: "components",
    },
    passthroughFileCopy: true,
    htmlTemplateEngine: "liquid",
    templateFormats: ["liquid", "md", "html", "yml"],
  }
}
