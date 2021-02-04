import { Controller } from "stimulus"

import { trigger } from "../../js/utils"

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
    const q = `?q=${this.inputTarget.selectizeControl.value.join(", ")}`

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${document.querySelector("body").dataset.lang}/photos/${q}`
    } else {
      trigger("layoutPhotos:historyPushState", {
        url: q,
        resetPhotosGrid: true,
      })

      this.inputTarget.selectizeControl.blur()
      trigger("dialogSimpleSearch:hide")
    }
  }

  clear() {
    this.inputTarget.selectizeControl.value = ""
  }

  setValue(e) {
    this.inputTarget.selectizeControl.value = e.detail.value
  }
}
