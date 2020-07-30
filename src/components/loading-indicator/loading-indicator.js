class LoadingIndicator extends HTMLElement {
  constructor() {
    super()
    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("loadingIndicator:show", this.show.bind(this))
    document.addEventListener("loadingIndicator:hide", this.hide.bind(this))
  }

  show(e) {
    if (e.detail && e.detail.id === this.id) {
      console.log(this.id)
      this.classList.add("is-visible")
    }
  }

  hide(e) {
    if (e.detail && e.detail.id === this.id) {
      this.classList.remove("is-visible")
    }
  }
}
window.customElements.define("loading-indicator", LoadingIndicator)
