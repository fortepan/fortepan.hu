const fs = require("fs")
const path = require("path")

module.exports = liquidEngine => {
  return {
    parse(tagToken) {
      this.args = tagToken.args
    },
    render(scope) {
      // Resolve variables
      const args = {}
      this.args.split(" ").forEach(arg => {
        args[arg.split(":")[0]] = liquidEngine.evalValue(arg.split(":")[1], scope)
      })

      if (path.extname(args.src) !== ".svg") {
        return Promise.reject(new Error("inlineSVG requires a filetype of svg"))
      }

      // read svg file content
      const data = fs.readFileSync(args.src, (err, contents) => {
        if (err) {
          return Promise.reject(err)
        }
        return contents
      })

      // inject exta attributes
      let attributes = ""
      Object.keys(args).forEach(arg => {
        if (arg !== "src") attributes += `${arg}="${args[arg]}" `
      })

      return Promise.resolve(data.toString("utf8").replace("<svg ", `<svg ${attributes}`))
    },
  }
}
