import config from "../../config"
import { ready } from "../../utils"

let theme = config.DEFAULT_THEME

const loadStateFromLocalStorage = () => {
  theme = localStorage.getItem("theme") || theme
}

const setTheme = newTheme => {
  const bodyNode = document.querySelector("body")
  bodyNode.classList.remove(`theme--${theme}`)
  bodyNode.classList.add(`theme--${newTheme}`)
  theme = newTheme
}

const saveStateToLocalStorage = () => {
  localStorage.setItem("theme", theme)
}

const toggleTheme = () => {
  setTheme(theme === "light" ? "dark" : "light")
  saveStateToLocalStorage()
}

ready(() => {
  // init theme
  loadStateFromLocalStorage()
  saveStateToLocalStorage()
  setTheme(theme)

  // bind custom event
  document.addEventListener("toggleTheme", toggleTheme)
})
