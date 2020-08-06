import searchAPI from "../../api/search"
import { trigger, lang } from "../../utils"
import addTag from "../../api/add-tag"

class SelectizeControl extends HTMLElement {
  constructor() {
    super()

    this.render()
    this.bindEvents()
  }

  set photoId(id) {
    this.pId = id
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
    this.autoSuggestNode = this.querySelector(".selectize-input__autosuggest")
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
          this.addTagNode(this.inputNode.value)
        }
      }

      const selectedNode = this.autoSuggestNode.querySelector(".selectize-input__autosuggest__item.is-selected")

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        this.showAutosuggestNode()
      }

      if (e.key === "ArrowDown" && selectedNode) {
        const nextNode =
          selectedNode.nextElementSibling || this.autoSuggestNode.querySelector(".selectize-input__autosuggest__item")
        selectedNode.classList.remove("is-selected")
        nextNode.classList.add("is-selected")
        this.inputNode.value = nextNode.textContent
        this.resizeInput()
      }

      if (e.key === "ArrowUp" && selectedNode) {
        const previousNode =
          selectedNode.previousElementSibling ||
          this.autoSuggestNode.querySelector(".selectize-input__autosuggest__item:last-child")
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

    this.submitNode = this.querySelector("button")
    this.submitNode.addEventListener("click", e => {
      e.preventDefault()
      this.submit().then(() => {
        this.removeAllTags()
        trigger("snackbar:show", { message: lang("tags_save_success"), status: "success", autoHide: true })
      })
    })
  }

  bindEvents() {
    this.addEventListener("click", () => {
      this.querySelector("input").focus()
    })
  }

  removeAllTags() {
    this.querySelectorAll(".selectize-control__tag").forEach(el => {
      el.parentNode.removeChild(el)
    })
  }

  showAutosuggestNode() {
    if (this.inputNode.value.length > 0) {
      searchAPI.autoSuggest(
        this.inputNode.value,
        "cimke_name",
        res => {
          this.autoSuggestNode.classList.add("is-visible")
          this.autoSuggestNode.innerHTML = ""

          // add first item with the actual value of the selectize input
          this.autoSuggestNode.appendChild(this.createAutoSuggestItem(this.inputNode.value))

          // add max 4 more items from the autosuggest filter results
          if (res.length > 0) {
            for (let i = 0; i < Math.min(10, res.length); i += 1) {
              this.autoSuggestNode.appendChild(this.createAutoSuggestItem(res[i]))
            }
          }

          // select the first item
          this.autoSuggestNode.querySelector(".selectize-input__autosuggest__item").classList.add("is-selected")
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

  resetAutosuggestNode() {
    this.autoSuggestNode.innerHTML = ""
    this.autoSuggestNode.classList.remove("is-visible")
  }

  createAutoSuggestItem(label) {
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

  submit() {
    return new Promise((resolve, reject) => {
      const tags = []
      this.querySelectorAll(".selectize-control__tag").forEach(el => {
        tags.push(el.textContent)
      })

      if (tags.length === 0) reject()

      const promises = []
      tags.forEach(tag => {
        promises.push(
          new Promise((addTagResolve, addTagReject) => {
            addTag
              .addTag(tag, this.pId)
              .then(resp => {
                if (resp.data.id) {
                  addTagResolve()
                } else {
                  addTagReject()
                }
              })
              .catch(err => {
                addTagReject(err)
              })
          })
        )
      })

      Promise.all(promises)
        .then(() => {
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

window.customElements.define("selectize-control", SelectizeControl)
