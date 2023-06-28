const inlineSVG = require("./plugins/inlineSVG")
const htmlmin = require("html-minifier")

module.exports = eleventyConfig => {
  // Disable .gitignore and use eleventy's own ignore file instead
  eleventyConfig.setUseGitIgnore(false)

  // Copy assets
  eleventyConfig.addPassthroughCopy({ "src/static/images": "/images/" })
  eleventyConfig.addPassthroughCopy({ "src/static/uploads": "/uploads/" })
  eleventyConfig.addPassthroughCopy({ "src/static/": "/" })
  eleventyConfig.addPassthroughCopy({ "src/data/photo_uploads.json": "/photo_uploads.json" })
  eleventyConfig.addPassthroughCopy({ "node_modules/@webcomponents/webcomponentsjs": "/webcomponents-polyfill" })

  // Define custom liquid tags and shortcodes

  eleventyConfig.setLiquidOptions({
    dynamicPartials: false,
  })

  eleventyConfig.addLiquidTag("inlineSVG", inlineSVG)
  eleventyConfig.addLiquidShortcode("now", () => {
    return Date.now()
  })
  eleventyConfig.addLiquidShortcode("date", (date, locale) => {
    if (date) {
      const dateFormat = new Intl.DateTimeFormat(locale == "hu" ? "hu-HU" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      let dateInstance = new Date(date)
      if (isNaN(dateInstance)) dateInstance = new Date(parseInt(date))
      if (isNaN(dateInstance)) return ""

      return dateFormat.format(dateInstance)
    }

    return ""
  })
  eleventyConfig.addLiquidShortcode("date_iso", (date, full = false) => {
    if (date) {
      let dateInstance = new Date(date)
      if (isNaN(dateInstance)) dateInstance = new Date(parseInt(date))
      if (isNaN(dateInstance)) return ""

      const iso = dateInstance.toISOString()
      return full ? iso : iso.split("T")[0].toString()
    }
    return ""
  })
  eleventyConfig.addLiquidShortcode("date_to_ms", date => {
    if (date) {
      return new Date(date).getTime()
    }
    return ""
  })

  eleventyConfig.addLiquidFilter("escapeHTML", unsafe => {
    return unsafe
      ? unsafe.replace(/[\u00A0-\u9999<>&]/g, i => {
          return `&#${i.charCodeAt(0)};`
        })
      : ""
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
