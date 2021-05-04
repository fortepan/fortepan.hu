import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["label", "input"]
  }

  onChange(e) {
    // show the label of the input field when the input value is not empty
    if (this.hasLabelTarget) {
      if (e.currentTarget.value.length > 0) {
        this.labelTarget.classList.add("is-visible")
      } else {
        this.labelTarget.classList.remove("is-visible")
      }
    }

    // remove any error indication on typing
    this.element.classList.remove("error")
  }

  keypress(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.inputTarget.value.length > 0) {
        this.inputTarget.form.submit()
      }
    }
  }
}
