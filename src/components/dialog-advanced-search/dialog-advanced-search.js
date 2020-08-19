import { trigger } from "../../utils"

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

  search() {
    const advancedSearch = {}

    if (this.querySelector("input[name=keyword]").value !== "")
      advancedSearch.q = this.querySelector("input[name=keyword]").value

    if (this.querySelector("input[name=country]").value !== "")
      advancedSearch.country = this.querySelector("input[name=country]").value

    if (this.querySelector("input[name=city]").value !== "")
      advancedSearch.city = this.querySelector("input[name=city]").value

    if (this.querySelector("input[name=year]").value !== "")
      advancedSearch.year = this.querySelector("input[name=year]").value

    if (this.querySelector("input[name=donor]").value !== "")
      advancedSearch.donor = this.querySelector("input[name=donor]").value

    const q = new URLSearchParams(advancedSearch)

    if (window.location.pathname.indexOf("/photos") === -1) {
      window.location = `/${document.querySelector("body").dataset.lang}/photos/?advancedSearch&${q}`
    } else {
      trigger("layoutPhotos:historyPushState", {
        url: `?advancedSearch&${q}`,
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
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-advanced-search", DialogAdvancedSearch)
