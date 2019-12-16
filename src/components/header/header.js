import { ready, trigger, removeClassByPrefix, click } from "../../utils"

let headerNode = null

const initHeader = el => {
  el.querySelector("#DarkThemeSwitcher").addEventListener(click(), () => {
    trigger("toggleTheme")
  })
  el.querySelector("#LightThemeSwitcher").addEventListener(click(), () => {
    trigger("toggleTheme")
  })

  el.querySelector("#CarouselClose").addEventListener(click(), () => {
    trigger("carousel:hide")
  })
}

document.addEventListener("header:addShadow", () => {
  headerNode.classList.add("header--shadow-bottom")
})

document.addEventListener("header:removeShadow", () => {
  headerNode.classList.remove("header--shadow-bottom")
})

document.addEventListener("header:showAction", e => {
  removeClassByPrefix(headerNode, "header--show-actions-")
  headerNode.classList.add(`header--show-actions-${e.detail.actions}`)

  const activeActions = headerNode.querySelector(".header__actions__group--active")
  if (activeActions) activeActions.classList.remove("header__actions__group--active")

  headerNode
    .querySelector(`.header__actions__group--${e.detail.actions}`)
    .classList.add("header__actions__group--active")
})

ready(() => {
  headerNode = document.querySelector(".header")
  if (headerNode) initHeader(headerNode)
})
