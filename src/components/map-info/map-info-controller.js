import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../js/utils"

export default class extends Controller {
  onOtherDialogsSettled() {
    // Defer so other listeners of the same event (e.g. tax1percent#show) run first.
    setTimeout(() => this.show(), 0)
  }

  show() {
    if (this.hasShown) return

    // Wait while another bottom banner (cookie consent, tax1percent) is still visible.
    if (document.querySelector(".cookie-consent.is-visible:not(.map-info)")) return

    this.hasShown = true
    this.element.classList.add("is-visible")
  }

  onDocumentInteraction(e) {
    if (!this.element.classList.contains("is-visible")) return
    if (e.target.closest(".map")) this.hide()
  }

  showAdvancedSearch(e) {
    e?.preventDefault()
    this.hide()
    trigger("dialogAdvancedSearch:show")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }
}
