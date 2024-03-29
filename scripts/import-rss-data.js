const Parser = require("rss-parser")
const fs = require("fs")

const parser = new Parser()

;(async () => {
  const rss = {}

  let feed = await parser.parseURL("https://hetifortepan.capacenter.hu/feed/")
  rss.hu = feed.items

  feed = await parser.parseURL("https://hetifortepan.capacenter.hu/en/feed/")
  rss.en = feed.items

  fs.writeFile(`src/data/rss.json`, JSON.stringify(rss), err => {
    if (err) console.log("error", err)
  })
})()
