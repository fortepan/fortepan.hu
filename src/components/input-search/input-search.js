import { trigger } from "../../utils"

class InputSearch extends HTMLElement {
  constructor() {
    super()
    this.form = this.querySelector("form")
    this.inputNode = this.querySelector(".input-search__selectize-control")

    this.bindCustomEvents()
    this.initForm()
  }

  submit(e) {
    if (e) e.preventDefault()
    const q = `?q=${this.inputNode.value.join(", ")}`

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${document.querySelector("body").dataset.lang}/photos/${q}`
    } else {
      trigger("layoutPhotos:historyPushState", {
        url: q,
        resetPhotosGrid: true,
      })

      this.inputNode.blur()
      trigger("dialogSimpleSearch:hide")
    }
  }

  clear() {
    this.inputNode.value = ""
  }

  get value() {
    return this.inputNode.value
  }

  set value(val) {
    this.inputNode.value = val
  }

  bindCustomEvents() {
    document.addEventListener("inputSearch:setValue", e => {
      if (e.detail && e.detail.value) {
        this.value = e.detail.value
      }
    })
  }

  initForm() {
    this.querySelector(".input-search__icon").addEventListener("click", e => {
      e.preventDefault()
      this.submit()
    })
  }
}
window.customElements.define("input-search", InputSearch)
