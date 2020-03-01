import { ready, trigger } from "../../utils"

const init = () => {
  document.querySelector(".article").addEventListener("scroll", e => {
    const view = e.target
    if (view.scrollTop > 0) {
      trigger("header:addShadow")
    } else {
      trigger("header:removeShadow")
    }
  })
}

ready(() => {
  if (document.querySelector(".article")) {
    init()
  }
})
