const Parser = require("rss-parser")
const fs = require("fs")

const parser = new Parser({
  customFields: {
    item: ["featured_image"],
  },
})

;(async () => {
  const rss = {}

  let feed = await parser.parseURL("https://hetifortepan.capacenter.hu/feed/")
  rss.hu = feed.items

  feed = await parser.parseURL("https://hetifortepan.capacenter.hu/en/feed/")
  rss.en = feed.items

  Object.keys(rss).forEach(lang => {
    rss[lang].forEach(item => {
      if (item.featured_image && item.featured_image.includes("fortepan_")) {
        const fileName = item.featured_image.split("fortepan_")[1]

        if (fileName.includes("-") || fileName.includes(".")) {
          const mid = fileName.includes("-") ? fileName.split("-")[0] : fileName.split(".")[0]

          // save the mid if it only contains numbers (then it's most probably a valid mid)
          if (/^\d+$/.test(mid.trim())) item.featured_image_mid = mid
        }
      }
    })
  })

  fs.writeFile(`src/data/rss.json`, JSON.stringify(rss), err => {
    if (err) console.log("error", err)
  })
})()
