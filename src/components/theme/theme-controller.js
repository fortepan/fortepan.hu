import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { setAppState, removeAppState } from "../../js/app"

export default class extends Controller {
  connect() {
    this.theme = config.DEFAULT_THEME

    this.loadStateFromLocalStorage()
    this.saveStateToLocalStorage()
    this.setTheme(this.theme)
  }

  loadStateFromLocalStorage() {
    this.theme = localStorage.getItem("theme") || this.theme
  }

  setTheme(newTheme) {
    removeAppState(`theme--${this.theme}`)
    setAppState(`theme--${newTheme}`)
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
