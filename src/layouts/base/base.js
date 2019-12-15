import { ready } from "../../utils"

let bodyNode = null

const initBase = () => {
  // add event listeners
  document.addEventListener("toggleTheme", () => {
    bodyNode.classList.toggle("theme--light")
    bodyNode.classList.toggle("theme--dark")
  })

  document.querySelector("#HeaderNavigationToggle").addEventListener("click", () => {
    document.querySelector("body").classList.toggle("sidebar--show")
  })
}

ready(() => {
  bodyNode = document.querySelector("body")
  initBase()
})
