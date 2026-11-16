import { slugify, getLocale, getOrg } from "../js/utils"
import config from "../data/siteConfig"

// Cache suggestions by locale and normalized search word.
const autosuggestCache = {}

export default async prefix => {
  const lang = getLocale()
  const cacheKey = `${lang}:${slugify(prefix)}`

  if (autosuggestCache[cacheKey]) {
    return autosuggestCache[cacheKey]
  }

  const params = new URLSearchParams({ locale: lang, word: prefix })
  const org = getOrg()
  if (org) params.set("org", org)

  const respJson = await fetch(`${config.BACKEND}/api/search/autocomplete?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
  const resp = await respJson.json()
  const suggestions = resp && Array.isArray(resp.words) ? resp.words : []

  autosuggestCache[cacheKey] = suggestions
  return suggestions
}
