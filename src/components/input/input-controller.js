import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["label"]
  }

  keyup(e) {
    // show the label of the input field when the input value is not empty
    if (this.hasLabelTarget) {
      if (e.currentTarget.value.length > 0) {
        this.labelTarget.classList.add("is-visible")
      } else {
        this.labelTarget.classList.remove("is-visible")
      }
    }
  }
}
