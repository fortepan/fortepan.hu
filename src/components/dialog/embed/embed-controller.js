import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["ratio", "height", "width"]
  }

  connect() {}

  show(e) {
    this.listId = e?.detail?.listId
    this.element.classList.add("is-visible")
  }

  hide() {
    delete this.listId
    this.element.classList.remove("is-visible")
  }

  restrictInput(e) {
    if (e && e.currentTarget) {
      e.currentTarget.value = e.currentTarget?.value.replace(/[^0-9%]/g, "")
    }
  }

  generateEmbedCode() {
    console.log("generate embed code action!!!")
  }
}
