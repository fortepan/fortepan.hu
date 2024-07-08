import { Controller } from "@hotwired/stimulus"

import { trigger } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["input", "label"]
  }

  toggleCheck() {
    this.inputTarget.checked = !this.inputTarget.checked
    trigger("change", null, this.inputTarget)
  }
}
