import { Controller } from "stimulus"

export default class extends Controller {
  show(e) {
    if (e.detail && e.detail.id === this.element.id) {
      this.element.classList.add("is-visible")
    }
  }

  hide(e) {
    if (e.detail && e.detail.id === this.element.id) {
      this.element.classList.remove("is-visible")
    }
  }
}
