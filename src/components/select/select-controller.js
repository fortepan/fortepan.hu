import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["label", "select"]
  }

  connect() {
    this.element.selectController = this
  }

  addOptions(options) {
    console.log(options)
  }
}
