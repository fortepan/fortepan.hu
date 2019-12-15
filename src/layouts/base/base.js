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

const initBackground = () => {
  const svg = bodyNode.querySelector(".background svg")
  const main = bodyNode.querySelector(".scrollview")
  main.addEventListener("scroll", () => {
    svg.style.transform = `rotateY(${Math.min(90, main.scrollTop / 10)}deg) translateZ(-${main.scrollTop / 10}px)`
    svg.style.opacity = Math.max(0, 100 - main.scrollTop / 20) / 100
  })
}

ready(() => {
  bodyNode = document.querySelector("body")

  initBase()
  initBackground()
})
