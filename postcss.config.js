const path = require("path")

module.exports = ctx => ({
  map: { inline: false },
  parser: "postcss-scss",
  plugins: {
    "postcss-import-ext-glob": {},
    "postcss-import": { root: ctx.file.dirname },
    "@csstools/postcss-sass": {},
    "postcss-inline-svg": {
      paths: ["."],
    },
    autoprefixer: {},
    "postcss-minify": process.env.ENV !== "production" ? false : {},
    "postcss-hash": {
      manifest: "src/data/manifest-css.json",
      name:
        process.env.ENV === "production"
          ? ({ dir, name, hash, ext }) => path.join(dir, name + "." + hash + ext)
          : ({ dir, name, ext }) => path.join(dir, name + ext),
    },
  },
})
