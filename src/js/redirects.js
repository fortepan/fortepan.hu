import { getURLParams } from "./utils"

// redirect calls from fortepan.eu and beta.fortepan.hu
const redirectDomains = ["fortepan.eu", "beta.fortepan.hu"]
redirectDomains.forEach(domain => {
  if (window.location.hostname.indexOf(domain) > -1) {
    window.location.href = window.location.href.replace(domain, "fortepan.hu")
  }
})

// redirect old search params
if (
  (window.location.pathname === "/" || window.location.pathname === "/advanced-search") &&
  window.location.search.length > 0
) {
  const urlParams = getURLParams()

  const transformParams = {
    image_id: "id",
    img: "id",
    donors: "donor",
    tags: "q",
    "AdvancedSearch[tag]": "tag",
    "AdvancedSearch[country]": "country",
    "AdvancedSearch[city]": "city",
    search: "q",
  }
  const newParams = {}
  Object.keys(urlParams).forEach(key => {
    const newKey = transformParams[key] || key
    newParams[newKey] = urlParams[key]
  })
  const q = new URLSearchParams(newParams).toString()
  window.location.href = `/hu/photos/?${q}`
}
