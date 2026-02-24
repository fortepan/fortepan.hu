import { Controller } from "@hotwired/stimulus"
import { appState } from "../../../js/app"
import { trigger, getURLParams, getLocale } from "../../../js/utils"
import config from "../../../data/siteConfig"

export default class extends Controller {
  static get targets() {
    return ["form", "input"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()

    const queryValues = []
    const params = []

    this.inputTarget.selectizeControl.value.forEach(value => {
      if (value.includes(":")) {
        const key = value.split(":")[0].trim()

        if (config().ADVANCED_SEARCH_KEYS.includes(key)) {
          params.push(`${key}=${value.split(":")[1].trim()}`)
        } else {
          queryValues.push(value)
        }
      } else {
        queryValues.push(value)
      }
    })

    if (params.length > 0) params.push(`advancedSearch=1`)
    if (queryValues.length > 0) params.push(`q=${queryValues.join(", ")}`)

    let query = params.length > 0 ? `?${params.join("&")}` : `?q`

    if (appState("is-map")) {
      // when we are in the map view we need to trigger the mapview:load event to reload the map with the new query parameters
      const existingQueryParams = getURLParams()
      const mapQuery = []

      if (existingQueryParams.gb) mapQuery.push(`gb=${existingQueryParams.gb}`)
      if (existingQueryParams.gc) mapQuery.push(`gc=${existingQueryParams.gc}`)
      if (existingQueryParams.gz) mapQuery.push(`gz=${existingQueryParams.gz}`)

      query = `?${mapQuery.join("&")}&${query.replace("?", "")}`

      this.hide()

      window.history.pushState(null, null, `/${getLocale()}/map/${query}`)
      // will load the map with new parameters
      trigger("mapview:load")
    } else if (window.location.pathname.indexOf("/photos") === -1 || appState("is-lists")) {
      window.location = `/${getLocale()}/photos/${query}`
    } else {
      trigger("photos:historyPushState", {
        url: query,
        resetPhotosGrid: true,
      })

      this.hide()
    }
  }

  show() {
    this.element.classList.add("is-visible")
    this.inputTarget.selectizeControl.reset()
    this.inputTarget.selectizeControl.focus()

    const urlParams = getURLParams()
    const values = []

    Object.keys(urlParams).forEach(key => {
      if (key === "q") {
        values.push(`${urlParams[key]}`)
      } else if (config().ADVANCED_SEARCH_KEYS.includes(key) && urlParams.advancedSearch) {
        values.push(`${key}:${urlParams[key]}`)
      }
    })

    this.inputTarget.selectizeControl.value = values.join(",")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  showAdvancedSearchDialog(e) {
    e.preventDefault()
    trigger("dialogAdvancedSearch:show")
  }
}
