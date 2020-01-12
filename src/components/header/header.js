import { ready, trigger } from "../../utils"

let headerNode = null

const initHeader = () => {
  headerNode.querySelector("#DarkThemeSwitcher").addEventListener("click", e => {
    e.preventDefault()
    trigger("toggleTheme")
  })
  headerNode.querySelector("#LightThemeSwitcher").addEventListener("click", e => {
    e.preventDefault()
    trigger("toggleTheme")
  })

  headerNode.querySelector("#CarouselClose").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:hide")
  })

  headerNode.querySelector("#HeaderSearch").addEventListener("click", e => {
    e.preventDefault()
    trigger("search:toggle")
  })
}

document.addEventListener("header:addShadow", () => {
  headerNode.classList.add("header--shadow-bottom")
})

document.addEventListener("header:removeShadow", () => {
  headerNode.classList.remove("header--shadow-bottom")
})

document.addEventListener("header:removeShadow", () => {
  headerNode.classList.remove("header--shadow-bottom")
})

document.addEventListener("carousel:show", () => {
  headerNode.classList.add("header--carousel-show")
})

document.addEventListener("carousel:hide", () => {
  headerNode.classList.remove("header--carousel-show")
})

ready(() => {
  headerNode = document.querySelector(".header")
  if (headerNode) initHeader()
})
