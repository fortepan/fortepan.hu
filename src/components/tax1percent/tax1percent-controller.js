import { Controller } from "stimulus"

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
  }

  show() {
    if (window.tax1percent.toString() === "1") {
      const ls = localStorage.getItem("tax1percent")

      // if stored date is older than 7 days, show the notification again
      if (!ls || ls < Date.now() - 4 * 24 * 60 * 60 * 1000) {
        this.element.classList.add("is-visible")
      }
    }
  }
}
