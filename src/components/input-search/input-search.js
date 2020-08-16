import { trigger } from "../../utils"
import searchAPI from "../../api/search"

class InputSearch extends HTMLElement {
  constructor() {
    super()
    this.inputNode = this.querySelector(".input-search__input")
    this.autoSuggestNode = this.querySelector(".input-search__autosuggest")

    // submit search form on enter
    this.inputNode.addEventListener(
      "keydown",
      function(e) {
        if (e.key === "Enter") {
          this.searchSubmit()
        }
      }.bind(this)
    )

    // hide autosuggest on blur
    this.inputNode.addEventListener(
      "blur",
      function() {
        setTimeout(() => {
          this.autoSuggestNode.classList.remove("is-visible")
        }, 200)
        trigger("dialogSimpleSearch:hide")
      }.bind(this)
    )

    // show autosuggest on focus
    this.inputNode.addEventListener("focus", this.showAutosuggestNode.bind(this))

    this.inputNode.addEventListener(
      "keyup",
      function(e) {
        // get selected autosuggest item
        const selectedNode = this.autoSuggestNode.querySelector(".input-search__autosuggest__item.is-selected")

        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
          this.showAutosuggestNode()
        }

        if (e.key === "ArrowDown" && selectedNode) {
          const nextNode =
            selectedNode.nextElementSibling || this.autoSuggestNode.querySelector(".input-search__autosuggest__item")
          selectedNode.classList.remove("is-selected")
          nextNode.classList.add("is-selected")
          this.inputNode.value = nextNode.textContent
        }

        if (e.key === "ArrowUp" && selectedNode) {
          const previousNode =
            selectedNode.previousElementSibling ||
            this.autoSuggestNode.querySelector(".input-search__autosuggest__item:last-child")
          selectedNode.classList.remove("is-selected")
          previousNode.classList.add("is-selected")

          // move cursor to the end of input value
          this.inputNode.value = previousNode.textContent
        }

        if (e.key === "Escape") {
          trigger("dialogSimpleSearch:hide")
          this.autoSuggestNode.classList.remove("is-visible")
        }
      }.bind(this)
    )

    // bind custom events
    this.bindCustomEvents()
  }

  showAutosuggestNode() {
    if (this.inputNode.value.length > 0) {
      searchAPI.autoSuggest(
        this.inputNode.value,
        false,
        function(res) {
          this.autoSuggestNode.classList.add("is-visible")
          this.autoSuggestNode.innerHTML = ""

          // add first item with the actual vaule of the search input
          this.autoSuggestNode.appendChild(this.createAutoSuggestItem(this.inputNode.value))

          // add max 4 more items from the autosuggest filter results
          if (res.length > 0) {
            for (let i = 0; i < Math.min(5, res.length); i += 1) {
              this.autoSuggestNode.appendChild(this.createAutoSuggestItem(res[i]))
            }
          }

          // select the first item
          this.autoSuggestNode.querySelector(".input-search__autosuggest__item").classList.add("is-selected")
        }.bind(this),
        function(error) {
          console.log(error)
          this.autoSuggestNode.classList.remove("is-visible")
        }.bind(this)
      )
    } else {
      this.autoSuggestNode.classList.remove("is-visible")
    }
  }

  searchSubmit() {
    const selectedNode = this.querySelector(".input-search__autosuggest__item.is-selected")
    const q = `?q=${selectedNode ? encodeURIComponent(selectedNode.textContent) : ""}`

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

  createAutoSuggestItem(label) {
    const itemNode = document.createElement("div")
    itemNode.className = "input-search__autosuggest__item"
    itemNode.textContent = label
    itemNode.addEventListener(
      "click",
      function(e) {
        const selectedNode = e.currentTarget.parentNode.querySelector(".input-search__autosuggest__item.is-selected")
        if (selectedNode) {
          selectedNode.classList.remove("is-selected")
        }
        e.currentTarget.classList.add("is-selected")
        this.searchSubmit()
      }.bind(this)
    )

    return itemNode
  }

  clear() {
    this.inputNode.value = ""
  }

  setValue(e) {
    if (e.detail && e.detail.value) {
      this.inputNode.value = e.detail.value
    }
  }

  bindCustomEvents() {
    document.addEventListener("inputSearch:clear", this.clear.bind(this))
    document.addEventListener("inputSearch:setValue", this.setValue.bind(this))
  }
}
window.customElements.define("input-search", InputSearch)
