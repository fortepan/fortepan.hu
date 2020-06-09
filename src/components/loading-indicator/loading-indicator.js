class LoadingIndicator extends HTMLElement {
  constructor() {
    super()
    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("loadingIndicator:show", this.show.bind(this))
    document.addEventListener("loadingIndicator:hide", this.hide.bind(this))
  }

  show() {
    this.classList.add("is-visible")
  }

  hide() {
    this.classList.remove("is-visible")
  }
}
window.customElements.define("loading-indicator", LoadingIndicator)
