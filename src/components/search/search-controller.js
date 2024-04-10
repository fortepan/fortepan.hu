import { Controller } from "stimulus"

import { trigger, getLocale } from "../../js/utils"

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

    this.inputTarget.selectizeControl.addTagNode(this.inputTarget.selectizeControl.inputTarget.value)
    const q = `?q=${this.inputTarget.selectizeControl.value.join(", ")}`

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${getLocale()}/photos/${q}`
    } else {
      trigger("photos:historyPushState", {
        url: q,
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
}
