import { Controller } from "@hotwired/stimulus"

import { trigger, getLocale, getURLParams, searchValuesToQueryParams } from "../../js/utils"
import { appState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return ["form", "input", "icon"]
  }

  connect() {
    // overwrite default form submit
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()

    const params = searchValuesToQueryParams(this.inputTarget.selectizeControl.value)

    let query = params.length > 0 ? `?${params.join("&")}` : `?q`

    if (appState("is-map")) {
      // when we are in the map view we need to trigger the mapview:load event to reload the map with the new query parameters
      const existingQueryParams = getURLParams()
      const mapQuery = []

      if (existingQueryParams.gb) mapQuery.push(`gb=${existingQueryParams.gb}`)
      if (existingQueryParams.gc) mapQuery.push(`gc=${existingQueryParams.gc}`)
      if (existingQueryParams.gz) mapQuery.push(`gz=${existingQueryParams.gz}`)

      query = `?${mapQuery.join("&")}&${query.replace("?", "")}`

      this.inputTarget.selectizeControl.blur()
      trigger("dialogSearch:hide")

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

      this.inputTarget.selectizeControl.blur()
      trigger("dialogSearch:hide")
    }
  }

  clear() {
    this.inputTarget.selectizeControl.value = ""
  }

  setValue(e) {
    this.inputTarget.selectizeControl.value = e.detail.value
  }

  showAdvancedSearchDialog(e) {
    e.preventDefault()
    trigger("dialogAdvancedSearch:show")
  }
}
