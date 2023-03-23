import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {}

  onCoverClick(e) {
    if (e) {
      e.preventDefault()

      const link = e.currentTarget.parentElement.querySelector("h3 a")
      if (link && link.href) {
        if (link.target === "_blank") {
          window.open(link.href, "_blank")
        } else {
          window.location = link.href
        }
      }
    }
  }
}
