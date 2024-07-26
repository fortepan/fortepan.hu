import { Controller } from "@hotwired/stimulus"

import { trigger, getLocale } from "../../js/utils"
import { appState } from "../../js/app"
import config from "../../data/siteConfig"

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

    const query = params.length > 0 ? `?${params.join("&")}` : `?q`

    if (window.location.pathname.indexOf("/photos") === -1 || appState("is-lists")) {
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
