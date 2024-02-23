import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {
    if (window.location.hash !== "") {
      // force to jump to an element given by de id if it exists
      document.querySelector(window.location.hash).scrollIntoView()
    }
  }
}
