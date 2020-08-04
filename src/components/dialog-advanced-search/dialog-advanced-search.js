class DialogAdvancedSearch extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogAdvancedSearch:show", this.show.bind(this))
    document.addEventListener("dialogAdvancedSearch:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.search.bind(this))
  }

  search() {}

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-advanced-search", DialogAdvancedSearch)
