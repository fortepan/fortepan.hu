import { Controller } from "@hotwired/stimulus"
import { setAppState } from "../../../js/app"
import { trigger } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {}

  remove(e) {
    if (e) e.preventDefault()

    setAppState("age-restriction-removed")
    trigger("dialogAgeRestriction:remove")

    this.hide()
  }

  show() {
    this.element.classList.add("is-visible")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }
}
