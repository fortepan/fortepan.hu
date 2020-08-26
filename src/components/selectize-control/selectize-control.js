import searchAPI from "../../api/search"

class SelectizeControl extends HTMLElement {
  constructor() {
    super()

    this.render()
    this.bindEvents()
  }

  addTagNode(val) {
    const tags = []
    this.querySelectorAll(".selectize-control__tag").forEach(el => {
      tags.push(el.textContent)
    })
    if (tags.indexOf(val) === -1) {
      const tagNode = document.createElement("div")
      tagNode.className = "selectize-control__tag"
      tagNode.textContent = val
      this.inputNode.parentElement.insertBefore(tagNode, this.inputNode)

      const close = document.createElement("a")
      close.className = "selectize-control__tag__close"
      close.tabIndex = -1
      close.addEventListener("click", evt => {
        evt.preventDefault()
        tagNode.parentNode.removeChild(tagNode)
      })
      tagNode.appendChild(close)
    }

    this.resetAutosuggestNode()
    this.inputNode.value = ""
    this.resizeInput()
  }

  resizeInput() {
    this.inputNodeLabel.textContent = this.inputNode.value
    this.inputNode.style.width = `${Math.max(4, this.inputNodeLabel.offsetWidth + 4)}px`
  }

  render() {
    this.autosuggestNode = this.querySelector(".selectize-input__autosuggest")
    this.inputNode = this.querySelector("input")

    this.inputNodeLabel = document.createElement("div")
    this.inputNodeLabel.className = "selectize-control__input hide"
    this.appendChild(this.inputNodeLabel)

    this.inputNode.addEventListener("input", this.resizeInput.bind(this))

    this.inputNode.addEventListener("keydown", e => {
      if (this.inputNode.value === "" && e.key === "Backspace") {
        if (this.inputNode.previousElementSibling) {
          this.inputNode.parentElement.removeChild(this.inputNode.previousElementSibling)
        }
      }
    })

    this.inputNode.addEventListener("keyup", e => {
      if (e.key === "Enter") {
        if (this.inputNode.value.length > 0) {
          // if people hit enter and the input field contains text then the text will be converted to a tag node
          this.addTagNode(this.inputNode.value)
        } else if (this.inputNode.value === "" && this.value.length > 0 && this.form) {
          // if people hit enter and the input field is empty but the selectize component
          // already contains some tags then the releted form should be submitted
          this.form.submit()
        }
      }

      const selectedNode = this.autosuggestNode.querySelector(".selectize-input__autosuggest__item.is-selected")

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        this.showAutosuggestNode()
      }

      if (e.key === "ArrowDown" && selectedNode) {
        const nextNode =
          selectedNode.nextElementSibling || this.autosuggestNode.querySelector(".selectize-input__autosuggest__item")
        selectedNode.classList.remove("is-selected")
        nextNode.classList.add("is-selected")
        this.inputNode.value = nextNode.textContent
        this.resizeInput()
      }

      if (e.key === "ArrowUp" && selectedNode) {
        const previousNode =
          selectedNode.previousElementSibling ||
          this.autosuggestNode.querySelector(".selectize-input__autosuggest__item:last-child")
        selectedNode.classList.remove("is-selected")
        previousNode.classList.add("is-selected")

        // move cursor to the end of input value
        this.inputNode.value = previousNode.textContent
        this.resizeInput()
      }

      if (e.key === "Escape") {
        this.inputNode.value = ""
        this.resetAutosuggest()
      }
    })
  }

  bindEvents() {
    this.addEventListener("click", () => {
      this.querySelector("input").focus()
    })
  }

  reset() {
    this.querySelectorAll(".selectize-control__tag").forEach(el => {
      el.parentNode.removeChild(el)
    })
  }

  get value() {
    const tags = []
    this.querySelectorAll(".selectize-control__tag").forEach(el => {
      tags.push(el.textContent)
    })
    return tags
  }

  set value(string) {
    const tags = string.split(", ")
    tags.forEach(tag => {
      this.addTagNode(tag)
    })
  }

  get form() {
    return this.inputNode.form
  }

  showAutosuggestNode() {
    if (this.inputNode.value.length > 0) {
      searchAPI.autoSuggest(
        this.inputNode.value,
        this.dataset.autosuggestFilter,
        res => {
          this.autosuggestNode.classList.add("is-visible")
          this.autosuggestNode.innerHTML = ""

          // add first item with the actual value of the selectize input
          this.autosuggestNode.appendChild(this.createAutosuggestItem(this.inputNode.value))

          // add max 4 more items from the autosuggest filter results
          if (res.length > 0) {
            for (let i = 0; i < Math.min(10, res.length); i += 1) {
              this.autosuggestNode.appendChild(this.createAutosuggestItem(res[i]))
            }
          }

          // select the first item
          this.autosuggestNode.querySelector(".selectize-input__autosuggest__item").classList.add("is-selected")
        },
        error => {
          console.log(error)
          this.autosuggestNode.classList.remove("is-visible")
        }
      )
    } else {
      this.autosuggestNode.classList.remove("is-visible")
    }
  }

  resetAutosuggestNode() {
    this.autosuggestNode.innerHTML = ""
    this.autosuggestNode.classList.remove("is-visible")
  }

  createAutosuggestItem(label) {
    const itemNode = document.createElement("div")
    itemNode.className = "selectize-input__autosuggest__item"
    itemNode.textContent = label
    itemNode.addEventListener("click", e => {
      const selectedNode = e.currentTarget.parentNode.querySelector(".selectize-input__autosuggest__item.is-selected")
      if (selectedNode) {
        selectedNode.classList.remove("is-selected")
      }
      e.currentTarget.classList.add("is-selected")

      this.addTagNode(e.currentTarget.textContent)
    })

    return itemNode
  }

  focus() {
    this.querySelector("input").focus()
  }
}

window.customElements.define("selectize-control", SelectizeControl)
