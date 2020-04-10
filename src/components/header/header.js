import throttle from "lodash/throttle"
import { ready, trigger } from "../../utils"

let headerNode = null
let navNode = null
let navTimer = null

const initHeader = () => {
  headerNode.querySelector("#DarkThemeSwitcher").addEventListener("click", e => {
    e.preventDefault()
    trigger("toggleTheme")
  })
  headerNode.querySelector("#LightThemeSwitcher").addEventListener("click", e => {
    e.preventDefault()
    trigger("toggleTheme")
  })

  if (headerNode.querySelector("#HeaderSearchToggle")) {
    headerNode.querySelector("#HeaderSearchToggle").addEventListener("click", e => {
      e.preventDefault()
      trigger("searchdialog:toggle")
    })
  }

  headerNode.querySelector("#HeaderNavigationToggle").addEventListener("click", e => {
    e.preventDefault()
    if (navTimer) clearTimeout(navTimer)
    const navToggleRect = e.currentTarget.getBoundingClientRect()
    navNode.style.left = `${navToggleRect.x + navToggleRect.width / 2}px`
    navNode.classList.toggle("header__nav--show")
  })

  document.addEventListener(
    "mousemove",
    throttle(e => {
      if (navTimer) clearTimeout(navTimer)
      navTimer = setTimeout(() => {
        const navBounds = navNode.getBoundingClientRect()
        if (
          !(
            e.clientX >= navBounds.left &&
            e.clientX <= navBounds.right &&
            e.clientY >= navBounds.top &&
            e.clientY <= navBounds.bottom
          )
        ) {
          navNode.classList.remove("header__nav--show")
        }
      }, 200)
    }, 100)
  )
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
  navNode = document.querySelector(".header__nav")
  if (headerNode && navNode) initHeader()
})
