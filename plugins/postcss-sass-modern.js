const path = require("path")
const { pathToFileURL } = require("url")
const postcss = require("postcss")
const sass = require("sass")

// postcss-import must flatten @imports before @use; color.adjust() in SCSS depends on this prepend.
module.exports = () => ({
  postcssPlugin: "postcss-sass-modern",
  Once(root, { result }) {
    const from = result.opts.from
    const production = process.env.ENV === "production"

    const compiled = sass.compileString(`@use "sass:color";\n${root}`, {
      url: from ? pathToFileURL(path.resolve(from)) : undefined,
      sourceMap: !production,
      sourceMapIncludeSources: !production,
    })

    result.root = postcss.parse(compiled.css, {
      ...result.opts,
      map: compiled.sourceMap ? { prev: compiled.sourceMap } : false,
    })
  },
})

module.exports.postcss = true
