import { Controller } from "stimulus"

import config from "../../data/siteConfig"

export default class CookieConsent extends Controller {
  connect() {
    this.theme = config.DEFAULT_THEME

    this.loadStateFromLocalStorage()
    this.saveStateToLocalStorage()
    this.setTheme(this.theme)

    document.addEventListener("toggleTheme", this.toggleTheme.bind(this))
  }

  loadStateFromLocalStorage() {
    this.theme = localStorage.getItem("theme") || this.theme
  }

  setTheme(newTheme) {
    this.element.classList.remove(`theme--${this.theme}`)
    this.element.classList.add(`theme--${newTheme}`)
    this.theme = newTheme
  }

  saveStateToLocalStorage() {
    localStorage.setItem("theme", this.theme)
  }

  toggleTheme() {
    this.setTheme(this.theme === "light" ? "dark" : "light")
    this.saveStateToLocalStorage()
  }
}
