const fs = require("fs")
const http = require("http")
const https = require("https")

// Keep this key compatible with src/api/autosuggest.js, which reads the
// generated data grouped by object key.
const KEYS = {
  EN: ["cimke_name"],
  HU: ["cimke_name"],
}

const API_BASE = process.env.AUTOCOMPLETE_API_BASE || "https://backend.fortepan.eu"
const ORG = process.env.AUTOCOMPLETE_ORG || ""
const LIMIT = process.env.AUTOCOMPLETE_LIMIT || 20000

const fetchJson = (url, body) =>
  new Promise((resolve, reject) => {
    const isHttps = url.indexOf("https") === 0
    const lib = isHttps ? https : http
    const request = lib.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      res => {
        let raw = ""
        res.on("data", chunk => {
          raw += chunk
        })
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`POST ${url} -> ${res.statusCode}: ${raw.slice(0, 200)}`))
            return
          }
          try {
            resolve(JSON.parse(raw))
          } catch (err) {
            reject(new Error(`Invalid JSON from ${url}: ${err.message}`))
          }
        })
      }
    )

    request.on("error", reject)
    request.write(JSON.stringify(body))
    request.end()
  })

const getWords = async lang => {
  const url = `${API_BASE.replace(/\/$/, "")}/api/search/list?limit=${encodeURIComponent(LIMIT)}`
  const response = await fetchJson(url, { org: ORG || null, lang: lang.toLowerCase() })
  const records = Array.isArray(response) ? response : response && (response.resp || response)

  let words
  if (Array.isArray(records)) {
    words = records.filter(item => item.locale === lang.toLowerCase()).map(item => item.word)
  } else if (records && Array.isArray(records.words)) {
    words = records.words
  }

  if (!words) {
    throw new Error(`Unexpected autocomplete response from ${url}: ${JSON.stringify(response).slice(0, 200)}`)
  }

  const cleanWords = Array.from(
    new Set(
      words
        .filter(word => typeof word === "string" || typeof word === "number")
        .map(word => String(word))
        .filter(word => word.length > 0)
    )
  )
  console.log(`locale=${lang.toLowerCase()} words=${cleanWords.length}`)
  return cleanWords
}

const saveAutocompleteLangFile = async lang => {
  const words = await getWords(lang)
  const keywords = {}
  KEYS[lang].forEach(key => {
    keywords[key] = words
  })

  const path = `src/static/autocomplete-${lang.toLowerCase()}.json`
  await fs.promises.writeFile(path, JSON.stringify(keywords))
  console.log(`wrote ${path} (${words.length} words)`)
}

const run = async () => {
  for (const lang of Object.keys(KEYS)) {
    await saveAutocompleteLangFile(lang)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
