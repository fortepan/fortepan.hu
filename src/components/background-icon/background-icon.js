import { ready } from "../../utils"

let backgroundIcon = null

const initBackgroundIcon = () => {
  const svg = document.querySelector(".background__icon__svg")
  const main = document.querySelector(".scrollview")
  main.addEventListener("scroll", () => {
    svg.style.transform = `rotateY(${Math.min(90, main.scrollTop / 10)}deg) translateZ(-${main.scrollTop / 10}px)`
    svg.style.opacity = Math.max(0, 100 - main.scrollTop / 20) / 100
  })
}

ready(() => {
  backgroundIcon = document.querySelector(".background__icon")
  if (!backgroundIcon) return

  initBackgroundIcon()
})
