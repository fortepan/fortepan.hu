import { Controller } from "stimulus"
import { throttle } from "lodash"

import autoSuggest from "../../api/autosuggest"

export default class extends Controller {
  static get targets() {
    return ["input", "autosuggest"]
  }

  connect() {
    this.keyup = throttle(this.keyup.bind(this), 200)
  }

  keyup(e) {
    if (typeof this.inputTarget.dataset.autosuggest !== "undefined") {
      // find the currently selected autosuggest item
      const selectedNode = this.autosuggestTarget.querySelector(".autosuggest__item.is-selected")

      // show the autosuggest result container except if the up or down keys were pressed
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        this.showAutosuggestPanel()
      }

      // if down arrow key was pressed
      if (e.key === "ArrowDown" && selectedNode) {
        const nextNode = selectedNode.nextElementSibling || this.autosuggestTarget.querySelector(".autosuggest__item")
        selectedNode.classList.remove("is-selected")
        nextNode.classList.add("is-selected")
        this.inputTarget.value = nextNode.textContent
      }

      // if up arrow key was pressed
      if (e.key === "ArrowUp" && selectedNode) {
        const previousNode =
          selectedNode.previousElementSibling || this.autosuggestTarget.querySelector(".autosuggest__item:last-child")
        selectedNode.classList.remove("is-selected")
        previousNode.classList.add("is-selected")

        // move cursor to the end of input value

        this.inputTarget.value = previousNode.textContent
      }

      // hide the autosuggest result panel if enter or ESC keys were pressed
      if (e.key === "Enter" || e.key === "Escape") {
        this.autosuggestTarget.classList.remove("is-visible")
      }
    }
  }

  createAutoSuggestItem(label) {
    const itemNode = document.createElement("div")
    itemNode.className = "autosuggest__item"
    itemNode.textContent = label
    itemNode.addEventListener("click", e => {
      const selectedNode = this.autosuggestTarget.querySelector(".autosuggest__item.is-selected")
      if (selectedNode) {
        selectedNode.classList.remove("is-selected")
      }
      e.currentTarget.classList.add("is-selected")
      this.autosuggestTarget.classList.remove("is-visible")

      if (this.element.selectizeControl) {
        this.element.selectizeControl.value = e.currentTarget.textContent
      } else {
        this.inputTarget.value = e.currentTarget.textContent
      }
    })

    return itemNode
  }

  showAutosuggestPanel() {
    if (this.inputTarget.value.length > 0) {
      // get filtered results based on the autosuggest data attribute of the input field
      autoSuggest(this.inputTarget.value, this.inputTarget.dataset.autosuggest)
        .then(res => {
          // show autosuggest result container and clear it's content
          this.autosuggestTarget.innerHTML = ""
          this.autosuggestTarget.classList.add("is-visible")

          // add the current value of the input field as the first item of the autosuggest result container
          this.autosuggestTarget.appendChild(this.createAutoSuggestItem(this.inputTarget.value))

          // add items from the autosuggest filter results
          if (res.length > 0) {
            res.forEach(r => {
              if (r !== this.inputTarget.value) this.autosuggestTarget.appendChild(this.createAutoSuggestItem(r))
            })
          }

          // select the first item
          this.autosuggestTarget.querySelector(".autosuggest__item").classList.add("is-selected")
        })
        .catch(() => {
          this.autosuggestTarget.classList.remove("is-visible")
        })
    } else {
      // hide autosuggest result container when the input field is empty
      this.autosuggestTarget.classList.remove("is-visible")
    }
  }
}
