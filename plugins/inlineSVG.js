const fs = require("fs")
const path = require("path")

module.exports = liquidEngine => {
  return {
    parse: function(tagToken) {
      this.args = tagToken.args
    },
    render: async function(ctx) {
      // Resolve variables

      const args = {}
      const argsArray = this.args.split(" ")
      for (const arg of argsArray) {
        args[arg.split(":")[0]] = await this.liquid.evalValue(arg.split(":")[1], ctx)
      }

      if (path.extname(args.src) !== ".svg") {
        throw new Error("inlineSVG requires a filetype of svg")
      }

      // read svg file content
      const data = await fs.readFileSync(args.src)

      // inject exta attributes
      let attributes = ""
      Object.keys(args).forEach(arg => {
        if (arg !== "src") attributes += `${arg}="${args[arg]}" `
      })

      return data.toString("utf8").replace("<svg", `<svg ${attributes}`)
    },
  }
}
