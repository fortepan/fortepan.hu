import { trigger, getURLParams } from "../../utils"

class DialogAdvancedSearch extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogAdvancedSearch:show", this.show.bind(this))
    document.addEventListener("dialogAdvancedSearch:hide", this.hide.bind(this))

    this.searchForm = this.querySelector("form")
    this.selectizeControl = this.querySelector(".dialog-advanced-search__selectize")
    this.initForm()
  }

  initForm() {
    this.searchForm.querySelector("button").addEventListener("click", this.search.bind(this))

    // reset form submit and submit with Enter
    this.searchForm.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault()
      }
    })
    this.searchForm.addEventListener("submit", e => {
      e.preventDefault()
    })
  }

  search() {
    const q = this.selectizeControl.value.join(", ")

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${document.querySelector("body").dataset.lang}/photos/?q=${q}`
    } else {
      trigger("layoutPhotos:historyPushState", {
        url: `?q=${q}`,
        resetPhotosGrid: true,
      })

      trigger("dialogAdvancedSearch:hide")
    }
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.selectizeControl.reset()
    this.selectizeControl.focus()

    if (getURLParams().q && getURLParams().q.indexOf(", ") !== -1) {
      this.selectizeControl.value = getURLParams().q
    }
  }
}

window.customElements.define("dialog-advanced-search", DialogAdvancedSearch)
