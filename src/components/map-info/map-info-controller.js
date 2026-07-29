import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../js/utils"

const STORAGE_KEY = "mapInfoSeen"

export default class extends Controller {
  onOtherDialogsSettled() {
    // Defer so other listeners of the same event (e.g. tax1percent#show) run first.
    setTimeout(() => this.show(), 0)
  }

  show() {
    if (sessionStorage.getItem(STORAGE_KEY)) return

    // Wait while another bottom banner (cookie consent, tax1percent) is still visible.
    if (document.querySelector(".cookie-consent.is-visible:not(.map-info)")) return

    this.element.classList.add("is-visible")
    sessionStorage.setItem(STORAGE_KEY, "1")
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
