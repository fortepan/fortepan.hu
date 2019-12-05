import { ready, trigger } from "../../app/app"

let headerNode = null

const initHeader = function(el) {
  el.querySelector("#DarkThemeSwitcher").addEventListener("click", () => {
    trigger("toggleTheme")
  })
  el.querySelector("#LightThemeSwitcher").addEventListener("click", () => {
    trigger("toggleTheme")
  })
}

document.addEventListener("header:addShadow", () => {
  headerNode.classList.add("header--shadow-bottom")
})

document.addEventListener("header:removeShadow", () => {
  headerNode.classList.remove("header--shadow-bottom")
})

ready(() => {
  headerNode = document.querySelector(".header")
  if (headerNode) initHeader(headerNode)
})
