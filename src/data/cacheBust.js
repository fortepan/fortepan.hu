const md5File = require("md5-file")

const cacheBust = () => {
  // A "map" of files to cache bust
  const files = {
    mainCss: "_compiled-assets/main.css",
    mainJs: "_compiled-assets/main.js",
  }
  return Object.entries(files).reduce((acc, [key, path]) => {
    const now = Date.now()
    let bust = now
    if (process.env.ENV === "production") {
      try {
        bust = md5File.sync(path, (_err, hash) => hash)
      } catch (err) {
        bust = now
      }
    }
    acc[key] = bust
    return acc
  }, {})
}
module.exports = cacheBust
