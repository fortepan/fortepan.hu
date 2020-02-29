import { ready } from "../../utils"

let bodyNode = null

const toggleTheme = () => {
  const savedTheme = localStorage.getItem("theme")
  if (bodyNode.classList.contains("theme--light")) {
    bodyNode.classList.remove("theme--light")
    bodyNode.classList.add("theme--dark")
    localStorage.setItem("theme", "dark")
  } else if (bodyNode.classList.contains("theme--dark")) {
    bodyNode.classList.remove("theme--dark")
    bodyNode.classList.add("theme--light")
    localStorage.setItem("theme", "light")
  } else {
    bodyNode.classList.add(savedTheme ? `theme--${savedTheme}` : "theme--light")
    if (!savedTheme) {
      localStorage.setItem("theme", "light")
    }
  }
}

const initBase = () => {
  // add event listeners
  document.querySelector("#HeaderNavigationToggle").addEventListener("click", () => {
    document.querySelector("body").classList.toggle("sidebar--show")
  })

  // init theme
  document.addEventListener("toggleTheme", toggleTheme)
  toggleTheme()
}

ready(() => {
  bodyNode = document.querySelector("body")
  initBase()
})
