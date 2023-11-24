import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["ratio"]
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

  generateEmbedCode() {
    console.log("generate embed code action!!!")
  }
}
