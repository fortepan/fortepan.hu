import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["input", "label"]
  }

  toggleCheck() {
    this.inputTarget.checked = !this.inputTarget.checked
  }
}
