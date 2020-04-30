import throttle from "lodash/throttle"
import config from "../../config"

class DialogSimpleSearch extends HTMLElement {
  constructor() {
    super()
    this.inputNode = this.querySelector("input")

    this.bindCustomEvents()
    this.bindEvents()
  }

  bindEvents() {
    window.addEventListener("resize", throttle(this.onWindowResize, 200).bind(this))
  }

  bindCustomEvents() {
    document.addEventListener("dialogSimpleSearch:hide", this.hide.bind(this))
    document.addEventListener("dialogSimpleSearch:show", this.show.bind(this))
    document.addEventListener("dialogSimpleSearch:toggle", this.toggle.bind(this))
  }

  show() {
    this.classList.add("is-visible")
    this.inputNode.focus()
  }

  hide() {
    this.classList.remove("is-visible")
  }

  toggle() {
    this.classList.toggle("is-visible")
    if (this.classList.contains("is-visible")) {
      this.inputNode.focus()
    }
  }

  onWindowResize() {
    if (window.innerWidth >= config.BREAKPOINT_DESKTOP && this.classList.contains("is-visible")) {
      this.classList.remove("is-visible")
    }
  }
}
window.customElements.define("dialog-simple-search", DialogSimpleSearch)
