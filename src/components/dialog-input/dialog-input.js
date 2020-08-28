import searchAPI from "../../api/search"

class DialogInput extends HTMLElement {
  constructor() {
    super()
    this.labelNode = this.querySelector("label")
    this.inputNode = this.querySelector("input")
    this.autoSuggestNode = this.querySelector(".dialog-input__autosuggest")

    this.bindEvents()
  }

  bindEvents() {
    this.inputNode.addEventListener("keyup", e => {
      if (e.currentTarget.value.length > 0) {
        this.labelNode.classList.add("is-visible")
      } else {
        this.labelNode.classList.remove("is-visible")
      }
    })

    if (typeof this.inputNode.dataset.autosuggest !== "undefined") {
      this.inputNode.addEventListener("keyup", e => {
        // get selected autosuggest item
        const selectedNode = this.autoSuggestNode.querySelector(".dialog-input__autosuggest__item.is-selected")

        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
          this.showAutosuggestNode()
        }

        if (e.key === "ArrowDown" && selectedNode) {
          const nextNode =
            selectedNode.nextElementSibling || this.autoSuggestNode.querySelector(".dialog-input__autosuggest__item")
          selectedNode.classList.remove("is-selected")
          nextNode.classList.add("is-selected")
          this.inputNode.value = nextNode.textContent
        }

        if (e.key === "ArrowUp" && selectedNode) {
          const previousNode =
            selectedNode.previousElementSibling ||
            this.autoSuggestNode.querySelector(".dialog-input__autosuggest__item:last-child")
          selectedNode.classList.remove("is-selected")
          previousNode.classList.add("is-selected")

          // move cursor to the end of input value
          this.inputNode.value = previousNode.textContent
        }

        if (e.key === "Enter") {
          this.autoSuggestNode.classList.remove("is-visible")
        }

        if (e.key === "Escape") {
          this.autoSuggestNode.classList.remove("is-visible")
        }
      })
    }
  }

  createAutoSuggestItem(label) {
    const itemNode = document.createElement("div")
    itemNode.className = "dialog-input__autosuggest__item"
    itemNode.textContent = label
    itemNode.addEventListener("click", e => {
      const selectedNode = e.currentTarget.parentNode.querySelector(".dialog-input__autosuggest__item.is-selected")
      if (selectedNode) {
        selectedNode.classList.remove("is-selected")
      }
      e.currentTarget.classList.add("is-selected")
      this.autoSuggestNode.classList.remove("is-visible")
      this.inputNode.value = e.currentTarget.textContent
    })

    return itemNode
  }

  showAutosuggestNode() {
    if (this.inputNode.value.length > 0) {
      searchAPI.autoSuggest(
        this.inputNode.value,
        this.inputNode.dataset.autosuggest,
        10,
        res => {
          this.autoSuggestNode.classList.add("is-visible")
          this.autoSuggestNode.innerHTML = ""

          // add first item with the actual value of the selectize input
          this.autoSuggestNode.appendChild(this.createAutoSuggestItem(this.inputNode.value))

          // add items from the autosuggest filter results
          if (res.length > 0) {
            res.forEach(r => {
              if (r !== this.inputNode.value) this.autoSuggestNode.appendChild(this.createAutoSuggestItem(r))
            })
          }

          // select the first item
          this.autoSuggestNode.querySelector(".dialog-input__autosuggest__item").classList.add("is-selected")
        },
        error => {
          console.log(error)
          this.autoSuggestNode.classList.remove("is-visible")
        }
      )
    } else {
      this.autoSuggestNode.classList.remove("is-visible")
    }
  }
}

window.customElements.define("dialog-input", DialogInput)
