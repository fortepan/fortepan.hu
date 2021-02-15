import { Controller } from "stimulus"
import { trigger, getURLParams, getLocale } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["form", "input"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()

    const q = this.inputTarget.selectizeControl.value.join(", ")

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${getLocale()}/photos/?q=${q}`
    } else {
      trigger("photos:historyPushState", {
        url: `?q=${q}`,
        resetPhotosGrid: true,
      })

      trigger("dialogSearch:hide")
    }
  }

  show() {
    this.element.classList.add("is-visible")
    this.inputTarget.selectizeControl.reset()
    this.inputTarget.selectizeControl.focus()

    if (getURLParams().q && getURLParams().q.indexOf(", ") !== -1) {
      this.inputTarget.selectizeControl.value = getURLParams().q
    }
  }

  hide() {
    this.element.classList.remove("is-visible")
  }
}
