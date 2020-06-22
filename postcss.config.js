module.exports = {
  map: false,
  plugins: {
    "postcss-devtools": {},
    "postcss-import": {},
    "@csstools/postcss-sass": {
      syntax: "postcss-scss",
    },
    "postcss-inline-svg": {},
    autoprefixer: {},
    cssnano: process.env.POSTCSS_ENV === "production" ? { preset: "default" } : false,
    "postcss-hash":
      process.env.POSTCSS_ENV === "production"
        ? {
            manifest: "./src/data/manifestCSS.json",
          }
        : false,
  },
}
