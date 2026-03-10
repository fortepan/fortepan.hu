const Parser = require("rss-parser")
const fs = require("fs")

const parser = new Parser({
  customFields: {
    item: ["featured_image"],
  },
  timeout: 60000,
})

;(async () => {
  const rss = {}
  let feed

  try {
    feed = await parser.parseURL("https://hetifortepan.capacenter.hu/feed/")
    rss.hu = feed.items
  } catch (err) {
    console.error("Error fetching HU feed:", err.message)
  }

  // continue only if HU feed was fetched successfully
  if (rss.hu) {
    try {
      feed = await parser.parseURL("https://hetifortepan.capacenter.hu/en/feed/")
      rss.en = feed.items
    } catch (err) {
      console.error("Error fetching EN feed:", err.message)
    }
  }

  if (rss.hu && rss.en) {
    // write out a combined file only we have both feeds fetched successfully
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
      if (err) {
        console.error("Error writing RSS file:", err)
      } else {
        console.log("RSS data successfully saved")
      }
    })
  } else {
    console.error("Error: Could not fetch either HU and EN feeds, no file is written")
  }
})()
