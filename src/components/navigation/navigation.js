import { ready } from "../../app/app"

const Navigation = function(el) {
  this.init = () => {
    console.log(el)
  }
}

ready(() => {
  const navigationNode = document.querySelector(".navigation")
  if (navigationNode) new Navigation(navigationNode).init()
})
