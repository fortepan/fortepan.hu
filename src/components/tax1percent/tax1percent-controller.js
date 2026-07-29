import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../js/utils"

export default class CookieConsent extends Controller {
  setValue() {
    localStorage.setItem("tax1percent", Date.now())
  }

  showDetails(e) {
    this.setValue()

    if (e) {
      e.preventDefault()

      if (e.currentTarget && e.currentTarget.getAttribute("href")) {
        window.location = e.currentTarget.getAttribute("href")
      }
    }
  }

  hide() {
    this.setValue()
    this.element.classList.remove("is-visible")
    // let queued dialogs (e.g. map-info) know the banner is closed
    trigger("tax1percent:closed")
  }

  show() {
    if (window.tax1percent) {
      const ls = localStorage.getItem("tax1percent")

      // if stored date is older than 7 days, show the notification again
      if (!ls || ls < Date.now() - 4 * 24 * 60 * 60 * 1000) {
        this.element.classList.add("is-visible")
      }
    }
  }
}
