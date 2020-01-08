import { ready, trigger, removeClassByPrefix } from "../../utils"

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
  if (headerNode) initHeader()
})
