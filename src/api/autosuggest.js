import { slugify, getLocale, getOrg } from "../js/utils"
import config from "../data/siteConfig"

let autosuggestList = []
let autosuggestListLoaded = false

// this is a cache that contains all previously entered autosuggest name / value pairs
const autosuggestCache = {}

const loadAutosuggestList = async (lang) => {
  // const respJson = await fetch(`${config.BACKEND}/api/search/list`)
  const org = { org: getOrg() }
  const language = { lang: getLocale()} 
  const respJson = await fetch(`${config.BACKEND}/api/search/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ ...org, ...language }),
  })
  const resp = await respJson.json()

  // filter items by language
  autosuggestList = resp.filter((item) => {
    return item.locale === lang
  })
  return true
}

export default async (prefix, categories, limit) => {
  let resp = null

  const lang = getLocale()
  const expression = slugify(prefix)

  // check autosuggest cache
  if (autosuggestCache[expression]) {
    resp = autosuggestCache[expression]
  } else {
    if (!autosuggestListLoaded) autosuggestListLoaded = await loadAutosuggestList(lang)

    let count = 0

    resp = autosuggestList.filter((item) => {
      if (count >= limit) {
        return false
      }
      if (item.word.indexOf(expression) >= 0) {
        count += 1
        return true
      }
      return false
    })
    autosuggestCache[expression] = resp
    return resp
  }

  return resp
}
