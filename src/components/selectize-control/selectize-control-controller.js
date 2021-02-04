import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["input", "tag", "fakeInput"]
  }

  connect() {
    this.element.selectizeControl = this
    this.inputTimeout = 0
  }

  // Create a tag element and append before the input field of the main element
  addTagNode(val) {
    const tags = []
    this.tagTargets.forEach(el => {
      tags.push(el.textContent)
    })
    const v = val.trim()
    if (tags.indexOf(v) === -1 && val !== "") {
      const tagNode = document.createElement("div")
      tagNode.className = "selectize-control__tag"
      tagNode.dataset.selectizeControlTarget = "tag"
      tagNode.textContent = v
      this.inputTarget.parentElement.insertBefore(tagNode, this.inputTarget)

      const close = document.createElement("a")
      close.className = "selectize-control__tag__close"
      close.tabIndex = -1
      close.addEventListener("click", evt => {
        evt.preventDefault()
        tagNode.parentNode.removeChild(tagNode)
        this.togglePlaceholder()
      })
      tagNode.appendChild(close)
    }

    // initialize input
    this.inputTarget.value = ""
    this.resizeInput()
    this.togglePlaceholder()
  }

  // This is a little hack to resize the input field based on the value length
  // when people start typing
  resizeInput() {
    this.fakeInputTarget.textContent = this.inputTarget.value.replace(/ /g, "&nbsp;")
    this.inputTarget.style.width = `${Math.max(4, this.fakeInputTarget.offsetWidth + 4)}px`
  }

  // There's a fake placeholder to mimic the look of a standard input HTML element UI
  blur() {
    setTimeout(() => {
      this.togglePlaceholder()
    }, 300)
  }

  // Actions on keyup event
  keydown(e) {
    if (this.inputTarget.value === "" && e.key === "Backspace") {
      if (this.inputTarget.previousElementSibling) {
        this.inputTarget.parentElement.removeChild(this.inputTarget.previousElementSibling)
      }
    }

    if (e.key === "," && this.inputTarget.value.length > 0) {
      e.preventDefault()
      // if people hit comma and the input field contains text then the text will be converted to a tag node
      this.addTagNode(this.inputTarget.value)
    }

    if ((e.key === " " || e.key === ",") && this.inputTarget.value.length === 0) {
      e.preventDefault()
    }
  }

  // submit related form
  keypress(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.inputTarget.value === "" && this.value.length > 0) {
        this.form.submit()
      }
    }
  }

  // create a new tag element when people hit ENTER
  keyup(e) {
    setTimeout(this.resizeInput.bind(this), 10)

    if (e.key === "Enter" && this.inputTarget.value.length > 0) {
      e.preventDefault()
      // if people hit enter and the input field contains text then the text will be converted to a tag node
      this.addTagNode(this.inputTarget.value)
    }

    // show / hide fake placeholder
    this.togglePlaceholder()
  }

  // when people past text into the input field
  paste(e) {
    e.preventDefault()
    this.value = e.clipboardData.getData("Text")
  }

  // focus
  focus() {
    this.inputTarget.focus()
  }

  // remove tags if reset method is fired
  reset() {
    this.tagTargets.forEach(el => {
      el.parentNode.removeChild(el)
    })
  }

  // return value of the element
  get value() {
    const tags = []
    this.tagTargets.forEach(el => {
      tags.push(el.textContent)
    })
    return tags
  }

  // set value
  set value(string) {
    this.reset()
    const tags = string.split(",")
    tags.forEach(tag => {
      this.addTagNode(tag)
    })

    this.togglePlaceholder()
  }

  get form() {
    return this.inputTarget.form
  }

  togglePlaceholder() {
    if (this.inputTarget.value.length === 0 && this.value.length === 0) {
      this.element.classList.add("is-empty")
    } else {
      this.element.classList.remove("is-empty")
    }
  }
}
