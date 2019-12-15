import { ready } from "../../utils"

let navigationNode = null

const Navigation = function() {
  this.init = () => {}
}

document.addEventListener("navigation:show", () => {
  navigationNode.classList.add("navigation--show")
})

document.addEventListener("navigation:hide", () => {
  navigationNode.classList.remove("navigation--show")
})

ready(() => {
  navigationNode = document.querySelector(".navigation")
  if (navigationNode) new Navigation(navigationNode).init()
})
